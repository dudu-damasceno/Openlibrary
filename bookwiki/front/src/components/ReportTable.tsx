// frontend/src/components/ReportTable.tsx
import React from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Typography } from '@mui/material';

const ReportTable = ({ data }: { data: any[] }) => {
  const renderCell = (value: any) => {
    if (Array.isArray(value)) {
      return (
        <div>
          {value.map((item, index) => (
            <div key={index} style={{ marginBottom: '8px', border: '1px solid #ddd', padding: '8px', borderRadius: '4px' }}>
              {renderCell(item)}
            </div>
          ))}
        </div>
      );
    }

    if (typeof value === 'object' && value !== null) {
      return (
        <div>
          {Object.keys(value).map((key) => (
            <div key={key}>
              <strong>{key}:</strong> {renderCell(value[key])}
            </div>
          ))}
        </div>
      );
    }

    if (typeof value === 'string' && (value.startsWith('http://') || value.startsWith('https://'))) {
      // Check if value is a URL
      if (value.endsWith('.jpg') || value.endsWith('.jpeg') || value.endsWith('.png') || value.endsWith('.gif')) {
        // Render image if it's an image URL
        return <img src={value} alt="Imagem" style={{ maxWidth: '100px', maxHeight: '100px' }} />;
      }
    }

    return value;
  };

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            {data.length > 0 && Object.keys(data[0]).map((key) => (
              <TableCell key={key}><Typography variant="subtitle2">{key}</Typography></TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((row, index) => (
            <TableRow key={index}>
              {Object.values(row).map((value, i) => (
                <TableCell key={i}>{renderCell(value)}</TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default ReportTable;
