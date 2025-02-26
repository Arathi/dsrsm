import { Button, Flex, Table, type TableProps } from "antd";

type Props = {

};

const BackupTable = () => {
  const columns: TableProps['columns'] = [{
    key: "id",
    title: "ID",
    dataIndex: "id",
  }, {
    key: "file-name",
    title: "文件名",
    dataIndex: "fileName",
  }, {
    key: "md5",
    title: "MD5",
    dataIndex: "md5",
  }, {
    key: "actions",
    title: "操作",
    dataIndex: "id",
    render: (id, record) => (
      <Flex>
        <Button>恢复</Button>
        <Button>删除</Button>
      </Flex>
    )
  }];
  const dataSource: object[] = [];
  
  return (
    <>
      <Table
        size="small"
        columns={columns}
        dataSource={dataSource}
        pagination={false}
      />
    </>
  );
}

export default BackupTable;
