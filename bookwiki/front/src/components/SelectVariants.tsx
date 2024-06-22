import * as React from 'react';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import axios from 'axios';

interface Attribute {
  tableName: string;
  attributeName: string;
}

interface Relationship {
  field: string;
  relation: string;
  relatedTable: string;
}

interface SelectVariantsProps {
  setTableName: React.Dispatch<React.SetStateAction<string>>;
  setTableData: React.Dispatch<React.SetStateAction<any[]>>;
}

const SelectVariants: React.FC<SelectVariantsProps> = ({ setTableName, setTableData }) => {
  const [tables, setTables] = React.useState<string[]>([]);
  const [attributes, setAttributes] = React.useState<Attribute[]>([]);
  const [selectedTable, setSelectedTable] = React.useState<string>('');
  const [selectedAttributes, setSelectedAttributes] = React.useState<Attribute[]>([]);
  const [filterField, setFilterField] = React.useState<Attribute | null>(null);
  const [filterOperator, setFilterOperator] = React.useState<string>('equals');
  const [filterValue, setFilterValue] = React.useState<string>('');
  const [filterRelationship, setFilterRelationship] = React.useState<Relationship | null>(null);
  const [limit, setLimit] = React.useState<number | ''>('');

  const [relationships, setRelationships] = React.useState<Relationship[]>([]);
  const [relatedTableAttributes, setRelatedTableAttributes] = React.useState<Attribute[]>([]);

  React.useEffect(() => {
    const fetchTables = async () => {
      try {
        const response = await axios.get<string[]>('http://localhost:5000/api/all-tables');
        setTables(response.data);
      } catch (error) {
        console.error('Erro ao buscar tabelas:', error);
      }
    };

    fetchTables();
  }, []);

  const fetchAttributes = async (tableName: string) => {
    try {
      const response = await axios.get<string[]>(`http://localhost:5000/api/table/attributes/${tableName}`);
      const attributesData = response.data.map(attribute => ({
        tableName,
        attributeName: attribute
      }));
      setAttributes(attributesData);
    } catch (error) {
      console.error(`Erro ao buscar atributos da tabela ${tableName}:`, error);
    }
  };

  const fetchRelationships = async (tableName: string) => {
    try {
      const response = await axios.get<Relationship[]>(`http://localhost:5000/api/table/relationships/${tableName}`);
      setRelationships(response.data);
    } catch (error) {
      console.error(`Erro ao buscar relacionamentos da tabela ${tableName}:`, error);
    }
  };

  const fetchRelatedTableAttributes = async (relatedTableName: string) => {
    try {
      const response = await axios.get<string[]>(`http://localhost:5000/api/table/attributes/${relatedTableName}`);
      const attributesData = response.data.map(attribute => ({
        tableName: relatedTableName,
        attributeName: attribute
      }));
      setRelatedTableAttributes(attributesData);
    } catch (error) {
      console.error(`Erro ao buscar atributos da tabela ${relatedTableName}:`, error);
    }
  };

  const handleChangeTableName = async (event: SelectChangeEvent<string>) => {
    const tableName = event.target.value;
    setSelectedTable(tableName);
    setTableName(tableName);

    fetchAttributes(tableName);
    fetchRelationships(tableName);
  };

  const handleGenerateReport = async () => {
    try {
      let selectedAttributesToSend: string[] = selectedAttributes.map(attr => `${attr.tableName}.${attr.attributeName}`);

      // Incluir atributos da tabela base nos atributos selecionados para enviar na consulta
      if (filterField && !filterRelationship) {
        selectedAttributesToSend.push(`${selectedTable}.${filterField.attributeName}`);
      }

      // Incluir atributos da tabela relacionada nos atributos selecionados para enviar na consulta
      if (filterRelationship && filterRelationship.relatedTable && filterField) {
        selectedAttributesToSend.push(`${filterRelationship.relatedTable}.${filterField.attributeName}`);
      }

      const response = await axios.post('http://localhost:5000/api/generate-report', {
        tableName: selectedTable,
        attributes: selectedAttributesToSend,
        filter: {
          field: filterField ? `${filterField.tableName}.${filterField.attributeName}` : null,
          operator: filterOperator,
          value: filterValue,
          relationship: filterRelationship ? filterRelationship.field : null,
        },
        limit: limit || undefined,
      });
      setTableData(response.data);
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
    }
  };

  const handleFilterFieldChange = (event: SelectChangeEvent<any>) => {
    const selectedAttribute = event.target.value as Attribute;
    setFilterField(selectedAttribute);
  };
  
  const handleFilterRelationshipChange = (event: SelectChangeEvent<string>) => {
    const selectedRelationship = relationships.find(rel => rel.field === event.target.value) || null;
    setFilterRelationship(selectedRelationship);

    if (selectedRelationship) {
      fetchRelatedTableAttributes(selectedRelationship.relatedTable);
    } else {
      setRelatedTableAttributes([]);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <FormControl variant="standard" sx={{ m: 1, minWidth: 300 }}>
        <InputLabel id="select-table-label">Selecione uma Tabela</InputLabel>
        <Select
          labelId="select-table-label"
          id="select-table"
          value={selectedTable}
          onChange={handleChangeTableName}
          label="Tabela"
          fullWidth
        >
          {tables.map((table) => (
            <MenuItem key={table} value={table}>
              {table}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {selectedTable && (
        <FormControl variant="standard" sx={{ m: 1, minWidth: 300 }}>
          <InputLabel id="select-attributes-label">Selecione Atributos da Tabela Base</InputLabel>
          <Select
            labelId="select-attributes-label"
            id="select-attributes"
            multiple
            value={selectedAttributes}
            onChange={(event) => setSelectedAttributes(event.target.value as Attribute[])}
            renderValue={(selected) => (selected as Attribute[]).map(attr => `${attr.tableName}.${attr.attributeName}`).join(', ')}
            fullWidth
          >
            {attributes.map((attribute) => (
              <MenuItem key={`${attribute.tableName}.${attribute.attributeName}`} value={attribute}>
                {`${attribute.tableName}.${attribute.attributeName}`}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}

      {selectedTable && (
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
          <FormControl variant="standard" sx={{ m: 1, minWidth: 300 }}>
            <InputLabel id="select-filter-field-label">Selecione Atributo para Filtro</InputLabel>
            <Select
              labelId="select-filter-field-label"
              id="select-filter-field"
              value={filterField || ''}
              onChange={handleFilterFieldChange}
              fullWidth
            >
              {attributes.map((attribute) => (
                <MenuItem key={`${attribute.tableName}.${attribute.attributeName}`} value={attribute}>
                  {`${attribute.tableName}.${attribute.attributeName}`}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl variant="standard" sx={{ m: 1, minWidth: 200 }}>
            <InputLabel id="select-filter-operator-label">Operador</InputLabel>
            <Select
              labelId="select-filter-operator-label"
              id="select-filter-operator"
              value={filterOperator}
              onChange={(event) => setFilterOperator(event.target.value as string)}
              fullWidth
            >
              <MenuItem value="equals">Equals</MenuItem>
              <MenuItem value="not equals">Not Equals</MenuItem>
              <MenuItem value="contains">Contains</MenuItem>
              <MenuItem value="starts with">Starts With</MenuItem>
              <MenuItem value="ends with">Ends With</MenuItem>
              <MenuItem value="greater than">Greater Than</MenuItem>
              <MenuItem value="less than">Less Than</MenuItem>
            </Select>
          </FormControl>

          <TextField
            label="Valor do Filtro"
            variant="standard"
            sx={{ m: 1 }}
            value={filterValue}
            onChange={(event) => setFilterValue(event.target.value)}
            fullWidth
          />
        </div>
      )}

      {selectedTable && (
        <FormControl variant="standard" sx={{ m: 1, minWidth: 300 }}>
          <InputLabel id="select-filter-relationship-label">Selecione Relacionamento para Filtro</InputLabel>
          <Select
            labelId="select-filter-relationship-label"
            id="select-filter-relationship"
            value={filterRelationship ? filterRelationship.field : ''}
            onChange={handleFilterRelationshipChange}
            fullWidth
          >
            <MenuItem value="">Nenhum</MenuItem>
            {relationships.map((relationship) => (
              <MenuItem key={relationship.field} value={relationship.field}>
                {relationship.field} ({relationship.relation} com {relationship.relatedTable})
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}

      <TextField
        label="Limite"
        variant="standard"
        sx={{ m: 1, minWidth: 300 }}
        type="number"
        value={limit}
        onChange={(event) => setLimit(event.target.value === '' ? '' : Number(event.target.value))}
        fullWidth
      />

      <Button variant="contained" sx={{ m: 1, minWidth: 300 }} onClick={handleGenerateReport}>
        Gerar Relatório
      </Button>
    </div>
  );
};

export default SelectVariants;
