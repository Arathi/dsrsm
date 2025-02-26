import { openPath } from "@tauri-apps/plugin-opener";
import {
  open as openDialog,
  save as saveDialog,
} from "@tauri-apps/plugin-dialog";
import {
  readDir,
  readFile,
  copyFile,
  mkdir,
  stat,
} from "@tauri-apps/plugin-fs";
import {
  documentDir,
  resolve,
} from "@tauri-apps/api/path";
import { Button, Card, Flex, Form, Input, List, Switch } from "antd";
import * as dayjs from "dayjs";
import { useEffect, useMemo, useState } from "react";

import SteamIdCalculator from "./components/SteamIdCalculator";

import "./App.less";

const ACCOUNT_ID_PATTERN = /REMASTERED\\(\d+)\\DRAKS0005/;

const App = () => {
  const [savePath, setSavePath] = useState('');
  const [backupDir, setBackupDir] = useState('');
  const [backups, setBackups] = useState<Record<string, string>>({});
  const [autoBackup, setAutoBackup] = useState(false);
  const [current, setCurrent] = useState<string | undefined>(undefined);
  const backupDisabled = useMemo(() => {
    return savePath === '';
  }, [savePath]);

  const backupList = useMemo(() => {
    const list = [];
    for (const key in backups) {
      list.push({
        key,
        name: key,
        path: backups[key],
      });
    }
    return list;
  }, [backups]);

  async function onSelectSavePath() {
    const path = await openDialog({
      title: "选择存档路径",
    });
    if (path !== null) {
      setSavePath(path);
    }
  }

  async function onOpenBackupDir() {
    await openPath(backupDir);
  }

  const accountId = useMemo(() => {
    const match = ACCOUNT_ID_PATTERN.exec(savePath);
    if (match !== null) {
      const id = match[1];
      return Number.parseInt(id);
    }
    return undefined;
  }, [savePath]);

  useEffect(() => {
    async function initBackupDir() {
      const document = await documentDir();
      const dir = await resolve(document, "NBGI", "backup");
      await mkdir(dir, { recursive: true });
      setBackupDir(dir);
    }
    initBackupDir();
  }, []);

  useEffect(() => {
    const path = savePath;
    console.info("存档文件路径发生变化：", path);
    const timer = watchSaveFile(path, 1000);
    return () => {
      console.info("停止监控存档文件：", path);
      clearInterval(timer);
    }
  }, [savePath]);

  useEffect(() => {
    const dir = backupDir;
    console.info("存档备份目录发生变化：", dir);
    const timer = watchBackupDir(dir, 1000);
    return () => {
      console.info("停止监控目录：", dir);
      clearInterval(timer);
    }
  }, [backupDir]);

  function watchSaveFile(path: string, interval: number = 1000) {
    console.info("开始监控存档文件：", path);
    const timer = setInterval(
      async () => {
        const saveFileStat = await stat(path);
        const { mtime: modifiedDate } = saveFileStat;
        const modifiedDay = dayjs(modifiedDate);
        const current = modifiedDay.format('YYYYMMDD-HHmmss');
        setCurrent(current);
      },
      interval,
    );
    return timer;
  }

  useEffect(() => {
    console.info("当前文件发生变化：", current);
  }, [current]);

  // useEffect(() => {
  //   console.info("备份目录内容发生变化：", backups);
  // }, [backups]);

  function watchBackupDir(dir: string, interval: number = 1000) {
    console.info("开始监控备份目录：", dir);
    const timer = setInterval(
      async () => {
        const entries = await readDir(backupDir);
        const backups: Record<string, string> = {};
        for (const entry of entries) {
          if (entry.isDirectory) {
            continue;
          }
          const name = entry.name;
          if (name.startsWith(`${accountId}-`) && name.endsWith(".sl2")) {
            // console.info("获取到存档文件：", entry);
            const path = await resolve(backupDir, name);
            backups[name] = path;
          }
        }
        setBackups(backups);
      },
      interval,
    );
    return timer;
  }

  async function backup() {
    console.info("开始备份：", current);
    const fileName = `${accountId}-${current}.sl2`;
    const dest = await resolve(backupDir, fileName);
    await copyFile(savePath, dest);
    console.info("备份完成：", dest);
  }

  function restore() {
    //
  }

  return (
    <>
      <Flex vertical className="app">
        <Flex vertical>
          <Form>
            <Flex gap={8}>
              <Form.Item label="存档路径" style={{ flex: 1 }}>
                <Input value={savePath} disabled />
              </Form.Item>
              <Button
                onClick={onSelectSavePath}
              >
                ...
              </Button>
            </Flex>
            <Flex gap={8}>
              <Form.Item label="备份目录" style={{ flex: 1 }}>
                <Input value={backupDir} disabled />
              </Form.Item>
              <Button
                onClick={onOpenBackupDir}
              >
                ...
              </Button>
            </Flex>
          </Form>
        </Flex>
        <List
          style={{
            marginBottom: 8,
            flex: 1,
          }}
          dataSource={backupList}
          renderItem={(item, index) => {
            console.info(`${index} => ${item}`);
            return (
              <Card key={`backup-${item.key}`}>
                <Flex>{item.name}</Flex>
                <Flex>
                  <Button>恢复</Button>
                  <Button>删除</Button>
                </Flex>
              </Card>
            );
          }}
        />
        <Flex align="center" gap={8}>
          <Flex gap={8} flex={1}>
            <span>Account ID:</span>
            <span>{accountId ?? '未定义'}</span>
          </Flex>
          <Flex gap={8}>
            <span>当前版本:</span>
            <span>{current ?? '未定义'}</span>
          </Flex>
        </Flex>
        <Flex justify="end" align="center" gap={8}>
          <Flex justify="start" align="center" gap={8} style={{ flex: 1 }}>
            <SteamIdCalculator />
          </Flex>
          <span>自动备份</span>
          <Switch
            value={autoBackup}
            onChange={setAutoBackup}
            unCheckedChildren={'关闭'}
            checkedChildren={'开启'}
          />
          <Button
            variant="solid"
            color="primary"
            disabled={backupDisabled}
            onClick={() => backup()}
          >
            备份
          </Button>
        </Flex>
      </Flex>
    </>
  );
}

export default App;
