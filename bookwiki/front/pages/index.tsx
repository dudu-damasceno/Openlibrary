// frontend/pages/index.tsx
import React, { useState } from 'react';
import Navbar from '../src/components/Navbar';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import SelectVariants from '../src/components/SelectVariants';
import ReportTable from '../src/components/ReportTable';

const Home: React.FC = () => {
  const [tableName, setTableName] = useState<string>('');
  const [tableData, setTableData] = useState<any[]>([]);

  return (
    <div style={{ display: 'flex', backgroundColor: '#f0f0f0', minHeight: '100vh' }}>
      <Navbar />
      <Container sx={{ color: '#000', paddingTop: '40px' }}>

        <SelectVariants setTableName={setTableName} setTableData={setTableData} />
        
        <Typography variant="h6" gutterBottom>
          Tabela Selecionada: {tableName}
        </Typography>
        <Typography variant="body1" gutterBottom>
          Dados da Tabela:
        </Typography>
        <ReportTable data={tableData} />
      </Container>
    </div>
  );
};

export default Home;
