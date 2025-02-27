import { BaseDirectory, documentDir, join } from "@tauri-apps/api/path";
import { exists, mkdir, readDir, stat, copyFile } from "@tauri-apps/plugin-fs";
import { Button, Flex, notification, Select, SelectProps, Switch, Table, TableProps } from "antd";
import { useEffect, useMemo, useState } from "react";
import { FILE_NAME, ACCOUNT_PATTERN } from "./utils/dsr";
import { openPath } from "@tauri-apps/plugin-opener";
import { format as formatDate } from "./utils/date";
import Backup from "./domains/backup";
import { STEAM_ID_BASE } from "./utils/steam";

import "./Appx.less";

const App = () => {
  const [rootDir, setRootDir] = useState<string>();

  const [accounts, setAccounts] = useState<number[]>([]);
  const [account, setAccount] = useState<number | undefined>(undefined);
  const accountOptions = useMemo<SelectProps['options']>(() => {
    return accounts.map((account) => ({
      key: `account-${account}`,
      label: `${account}/DRAKS0005.sl2`,
      value: account,
    }));
  }, [accounts]);
  const steamId = useMemo(() => {
    if (account === undefined || account === null) return "未选择";
    const id = STEAM_ID_BASE + BigInt(account);
    return `${id}`;
  }, [account]);

  const [version, setVersion] = useState<string>();

  const [versions, setVersions] = useState<string[]>([]);
  const backups = useMemo(() => {
    return versions.map((version) => ({
      version,
      fileName: `${version}.sl2`,
    }));
  }, [versions]);

  const [autoBackup, setAutoBackup] = useState(false);

  useEffect(() => {
    init();
  }, []);

  useEffect(() => {
    if (rootDir === undefined) {
      return;
    }
    console.info("根目录发生变化：", rootDir);
    reloadAccounts(rootDir);
  }, [rootDir]);

  useEffect(() => {
    if (account === undefined) {
      console.warn("未选择账户");
      return;
    }

    console.info("当前账户发生变化：", account);
    updateVersion(account);

    console.info("开始监视存档：", account);
    const versionUpdater = setInterval(() => updateVersion(account), 1000);
    const backupLoader = setInterval(() => reloadBackups(account), 1000);
    return () => {
      console.warn("停止监视存档：", account);
      clearInterval(versionUpdater);
      clearInterval(backupLoader);
    }
  }, [account]);

  useEffect(() => {
    console.info("存档版本发生变化：", version);
    if (version === undefined) {
      return;
    }

    if (autoBackup) {
      console.info("自动备份已开启，正在备份：", version);
      backup(version, false);
    }
  }, [version, autoBackup]);

  async function init() {
    console.info("开始初始化");

    // 初始化根目录：NBGI/DARK SOULS REMASTERED
    const rootDir = await join("NBGI", "DARK SOULS REMASTERED");
    const rootDirExists = await exists(
      rootDir,
      { baseDir: BaseDirectory.Document },
    );

    if (!rootDirExists) {
      console.info("正在创建根目录：", rootDir);
      await mkdir(
        rootDir,
        {
          baseDir: BaseDirectory.Document,
          recursive: true,
        }
      );
    } else {
      console.debug("根目录已存在：", rootDir);
    }

    setRootDir(rootDir);
  }

  async function reloadAccounts(rootDir: string) {
    const accounts: number[] = [];

    const entries = await readDir(rootDir, {
      baseDir: BaseDirectory.Document,
    });

    for (const entry of entries) {
      const name = entry.name;
      if (entry.isFile) {
        continue;
      }

      if (!ACCOUNT_PATTERN.test(name)) {
        continue;
      }

      const account = Number.parseInt(name);
      if (account <= 0 || account > 0xFFFF_FFFF) {
        continue;
      }

      const path = await join(rootDir, name, FILE_NAME);
      const fileExists = await exists(path, {
        baseDir: BaseDirectory.Document,
      });
      if (!fileExists) {
        continue;
      }

      accounts.push(account);
    }
    
    setAccounts(accounts);
  }

  async function updateVersion(account: number) {
    if (rootDir === undefined) {
      return;
    }

    const path = await join(
      rootDir,
      `${account}`,
      FILE_NAME,
    );

    const info = await stat(path, {
      baseDir: BaseDirectory.Document,
    });

    const { mtime } = info;
    if (mtime !== null) {
      const version = formatDate(mtime, "YYMMDD-HHmmss");
      setVersion(version);
    }
  }

  async function reloadBackups(account: number) {
    if (rootDir === undefined) {
      return;
    }

    const dir = await join(
      rootDir,
      `${account}`,
      'backup',
    );

    const backupDirExists = await exists(dir, {
      baseDir: BaseDirectory.Document,
    });
    if (!backupDirExists) {
      await mkdir(dir, {
        baseDir: BaseDirectory.Document,
      });
    }

    const entries = await readDir(dir, {
      baseDir: BaseDirectory.Document,
    });
    
    const versions: string[] = [];
    for (const entry of entries) {
      if (entry.isDirectory) {
        continue;
      }

      const name = entry.name;
      if (!name.endsWith(".sl2")) {
        continue;
      }

      const version = name.slice(0, -4);
      versions.push(version);
    }
    setVersions(versions);
  }

  async function openSaveDir() {
    const document = await documentDir();
    const dir = await join(
      document,
      "NBGI",
      "DARK SOULS REMASTERED",
      `${account}`,
    );
    console.info("打开存档目录：", dir);
    openPath(dir);
  }

  async function openDetails() {
    const path = await join(
      "NBGI",
      "DARK SOULS REMASTERED",
      `${account}`,
      FILE_NAME,
    );
    console.info("打开存档详情：", path);
  }

  async function backup(version: string, force: boolean = false) {
    if (rootDir === undefined) {
      return false;
    }

    const src = await join(rootDir, `${account}`, FILE_NAME);

    const backupDir = await join(rootDir, `${account}`, 'backup');
    const backupDirExists = await exists(backupDir, {
      baseDir: BaseDirectory.Document,
    });
    if (!backupDirExists) {
      await mkdir(backupDir, {
        baseDir: BaseDirectory.Document,
      });
    }

    const fileName = `${version}.sl2`;

    const dest = await join(backupDir, fileName);
    const versionExists = await exists(dest, {
      baseDir: BaseDirectory.Document,
    });
    if (versionExists) {
      console.warn("版本已存在：", version);
      if (force === false) {
        notification.warning({
          message: "该版本已存在",
        })
        return;
      }
      console.info("强制更新备份版本：", version);
    }

    await copyFile(
      src,
      dest,
      {
        fromPathBaseDir: BaseDirectory.Document,
        toPathBaseDir: BaseDirectory.Document,
      }
    );

    notification.info({
      message: "备份完成",
    })
  }

  async function onTestClick() {
  }

  const columns: TableProps<Backup>['columns'] = [
    {
      key: "version",
      title: "版本",
      dataIndex: "version",
      width: 120,
    },
    {
      key: "file-name",
      title: "文件名",
      dataIndex: "fileName",
    },
    {
      key: "actions",
      title: "操作",
      dataIndex: "version",
      width: 150,
      render: (version, record) => (
        <Flex justify="center" gap={8}>
          <Button
            variant="solid"
            color="primary"
            size="small"
            onClick={() => {
              console.info(`恢复存档文件，账户：${account}，版本：${version}`);
            }}
          >
            恢复
          </Button>
          <Button
            variant="solid"
            color="danger"
            size="small"
            onClick={() => {
              console.warn(`删除备份文件，账户：${account}，版本：${version}`);
            }}
          >
            删除
          </Button>
        </Flex>
      )
    },
  ];

  return (
    <Flex className="asm-app" vertical gap={8}>
      <Flex align="center" gap={8}>
        <Flex justify="end" style={{ width: 120 }}>存档账户</Flex>
        <Select
          options={accountOptions}
          value={account}
          onChange={setAccount}
          allowClear
          style={{ width: "100%" }}
        />
        <Button
          variant="solid"
          color="primary"
          onClick={() => {
            if (rootDir !== undefined) {
              reloadAccounts(rootDir);
            }
          }}
          disabled={rootDir === undefined}
        >
          刷新
        </Button>
        <Button
          variant="solid"
          color="primary"
          onClick={openSaveDir}
          disabled={account === undefined}
        >
          打开
        </Button>
        <Button
          variant="solid"
          color="primary"
          onClick={openDetails}
          disabled={account === undefined}
        >
          详细
        </Button>
      </Flex>
      <Flex vertical flex={1}>
        <Table<Backup>
          size="small"
          columns={columns}
          dataSource={backups}
          rowKey="version"
          pagination={false}
        />
      </Flex>
      <Flex align="center">
        <Flex align="center" gap={8} style={{ flex: 1 }}>
          <Button onClick={onTestClick}>测试</Button>
          <span>{ steamId }</span>
          <span>{ version }</span>
        </Flex>
        <Flex justify="end" align="center" gap={8}>
          <span>自动备份</span>
          <Switch
            value={autoBackup}
            onChange={setAutoBackup}
            unCheckedChildren="关闭"
            checkedChildren="开启"
          />
          <Button
            variant="solid"
            color="primary"
            disabled={account === undefined || version === undefined}
            onClick={() => {
              if (account !== undefined && version !== undefined) {
                backup(version);
              }
            }}
          >
            备份
          </Button>
        </Flex>
      </Flex>
    </Flex>
  );
}

export default App;
