import { documentDir, resolve } from "@tauri-apps/api/path";
import {
  copyFile,
  exists,
  readDir,
  stat,
} from "@tauri-apps/plugin-fs";
import { format } from "./date";

export const ACCOUNT_PATTERN = /^\d{1,10}$/;
export const FILE_NAME = "DRAKS0005.sl2";
const ACCOUNT_MAX = 0xffff_ffff;

async function savesDir(): Promise<string> {
  const document = await documentDir();
  return resolve(document, "NBGI", "DARK SOULS REMASTERED");
}

async function saveDir(account: number): Promise<string> {
  const baseDir = await savesDir();
  return await resolve(baseDir, account.toString());
}

async function backupDir(account: number): Promise<string> {
  const dir = await saveDir(account);
  return await resolve(dir, "backup");
}

async function savePath(account: number): Promise<string> {
  const dir = await saveDir(account);
  return await resolve(dir, FILE_NAME);
}

export async function listAccounts(): Promise<number[]> {
  const accounts: number[] = [];
  const baseDir = await savesDir();
  const entries = await readDir(baseDir);
  for (const entry of entries) {
    const name = entry.name;
    if (!entry.isDirectory) {
      console.warn(`${name}不是目录`);
      continue;
    }

    if (!ACCOUNT_PATTERN.test(name)) {
      console.warn(`${name}不是账户ID`);
      continue;
    }

    const account = Number.parseInt(name);
    if (account <= 0 || account > ACCOUNT_MAX) {
      console.warn(`${name}不在有效值范围内`);
      continue;
    }

    const filePath = await savePath(account);
    const fileExists = await exists(filePath);
    if (!fileExists) {
      console.warn(`${name}下未找到存档文件`);
      continue;
    }

    accounts.push(account);
  }
  return accounts;
}

async function modifiedTime(account: number) {
  const baseDir = await savesDir();
  const savePath = await resolve(baseDir, account.toString(), FILE_NAME);
  const saveFileStat = await stat(savePath);
  return saveFileStat.mtime;
}

async function backup(account: number) {
  const src = await savePath(account);
  const info = await stat(src);
  const { mtime } = info;
  if (mtime === null) {
    console.warn("无法读取存档文件的修改时间");
    return false;
  }

  const destDir = await backupDir(account);
  const version = format(mtime);
  const backupFileName = `${version}.sl2`;
  const dest = await resolve(destDir, backupFileName);
  await copyFile(src, dest);
  return true;
}

async function restore(account: number, version: string) {
  const backupFileName = `${version}.sl2`;
  const srcDir = await backupDir(account);
  const src = await resolve(srcDir, backupFileName);
  const dest = await savePath(account);
  await copyFile(src, dest);
}
