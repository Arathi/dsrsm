import { useEffect, useState } from "react";
import reactLogo from "./assets/react.svg";
import { invoke } from "@tauri-apps/api/core";
import { Button, Flex, Form, Input, List, Switch } from "antd";
import { openPath } from "@tauri-apps/plugin-opener";
import {
  open as openDialog,
  save as saveDialog,
} from "@tauri-apps/plugin-dialog";
import {
  readDir,
  readFile,
  copyFile,
  stat,
} from "@tauri-apps/plugin-fs";

import "./App.less";

const App = () => {
  const [savePath, setSavePath] = useState('');
  const [backupDir, setBackupDir] = useState('');
  const [backups, setBackups] = useState<string[]>([]);
  const [watch, setWatch] = useState(false);

  async function onOpenSavePath() {
    const path = await openDialog({
      title: "选择存档路径",
    });
    if (path !== null) {
      setSavePath(path);
    }
  }

  async function onOpenBackupDir() {
    const dir = await openDialog({
      title: "选择备份目录",
      directory: true,
    });
    if (dir !== null) {
      setBackupDir(dir);
    }
  }

  useEffect(() => {
    if (watch) {
      console.info("开始监视", savePath);
      const timer = setInterval(async () => {
        const {
          atime,
          birthtime,
          mtime,
        } = await stat(savePath);
        console.info("文件状态：", {
          atime,
          birthtime,
          mtime
        });
      }, 1000);
      return () => {
        console.info("停止监视", savePath);
        clearInterval(timer);
      };
    }
  }, [savePath, watch]);

  return (
    <>
      <Flex vertical className="app">
        <Flex vertical>
          <Form>
            <Flex gap={8}>
              <Form.Item label="存档路径" style={{ flex: 1 }}>
                <Input value={savePath} />
              </Form.Item>
              <Button onClick={onOpenSavePath}>...</Button>
            </Flex>
            <Flex gap={8}>
              <Form.Item label="备份目录" style={{ flex: 1 }}>
                <Input value={backupDir} />
              </Form.Item>
              <Button onClick={onOpenBackupDir}>...</Button>
            </Flex>
          </Form>
        </Flex>
        <Flex
          flex={1}
          justify="center"
          align="center"
          style={{ marginBottom: 8 }}
        >
          <List></List>
        </Flex>
        <Flex justify="end" align="center" gap={8}>
          <Switch
            value={watch}
            onChange={setWatch}
            checkedChildren={'自动'}
            unCheckedChildren={'手动'}
          />
          <Button>备份</Button>
        </Flex>
      </Flex>
    </>
  );
}

export default App;
