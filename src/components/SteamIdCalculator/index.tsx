import { Button, Form, Input, InputProps, Modal } from "antd"
import { useEffect, useMemo, useState } from "react";

const STEAM_ID_ZERO = 76561197960265728n;

const SteamIdCalculator = () => {
  const [open, setOpen] = useState(false);
  const [steamId, setSteamId] = useState(STEAM_ID_ZERO);
  const [accountId, setAccountId] = useState(0n);
  const steamIdStatus = useMemo<InputProps['status']>(() => {
    if (steamId < STEAM_ID_ZERO) {
      return 'error';
    }
    return undefined;
  }, [steamId]);
  const accountIdStatus = useMemo<InputProps['status']>(() => {
    if (accountId < 0n) {
      return 'error';
    }
    return undefined;
  }, [accountId]);

  return (
    <>
      <Button
        variant="solid"
        color="primary"
        onClick={() => { setOpen(true); }}
      >
        SteamID计算器
      </Button>
      <Modal
        open={open}
        title="SteamID计算器"
        centered
        onOk={() => {
          setOpen(false);
        }}
        onCancel={() => {
          setOpen(false);
        }}
      >
        <Form labelCol={{ span: 6 }}>
          <Form.Item
            label="SteamID (64位)"
            style={{ marginBottom: 8 }}
          >
            <Input
              value={`${steamId}`}
              onChange={(e) => {
                try {
                  const value = e.currentTarget.value;
                  const steamId = BigInt(value);
                  setSteamId(steamId);
                  setAccountId(steamId - STEAM_ID_ZERO);
                } catch (ex) {
                  console.warn("数值转换失败：", ex);
                }
              }}
              status={steamIdStatus}
              style={{ width: "100%" }}
            />
          </Form.Item>
          <Form.Item
            label="AccountID (32位)"
            style={{ marginBottom: 8 }}
          >
            <Input
              value={`${accountId}`}
              onChange={(e) => {
                try {
                  const value = e.currentTarget.value;
                  const accountId = BigInt(value);
                  setAccountId(accountId);
                  setSteamId(accountId + STEAM_ID_ZERO);
                } catch (ex) {
                  console.warn("数值转换失败：", ex);
                }
              }}
              status={accountIdStatus}
              style={{ width: "100%" }}
            />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}

export default SteamIdCalculator;
