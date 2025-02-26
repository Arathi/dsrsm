import { Button, Card, Flex } from "antd";

type Props = {
  account: string;
  modified: string;
}

const BackupCard: React.FC<Props> = ({ account, modified }) => {
  return (
    <Card>
      <Flex>
        <Flex>
          {account}-${modified}
        </Flex>
        <Flex>
          <Button variant="solid" color="primary">恢复</Button>
          <Button variant="solid" color="danger">删除</Button>
        </Flex>
      </Flex>
    </Card>
  );
}

export default BackupCard;
