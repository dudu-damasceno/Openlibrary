import * as React from 'react';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import ClearIcon from '@mui/icons-material/Clear';
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

interface Filter {
  attribute: Attribute;
  operator: string;
  value: string;
}

interface SelectVariantsProps {
  setTableName: React.Dispatch<React.SetStateAction<string>>;
  setTableData: React.Dispatch<React.SetStateAction<any[]>>;
}

const SelectVariants: React.FC<SelectVariantsProps> = ({ setTableName, setTableData }) => {
  const [tables, setTables] = React.useState<string[]>([]);
  const [attributes, setAttributes] = React.useState<Attribute[]>([]);
  const [selectedTable, setSelectedTable] = React.useState<string>('');
  const [selectedAttributes, setSelectedAttributes] = React.useState<string[]>([]);
  const [filters, setFilters] = React.useState<Filter[]>([]);
  const [relationships, setRelationships] = React.useState<Relationship[]>([]);
  const [selectedRelationships, setSelectedRelationships] = React.useState<string[]>([]);
  const [relationshipAttributes, setRelationshipAttributes] = React.useState<{ [key: string]: Attribute[] }>({});
  const [limit, setLimit] = React.useState<number | ''>('');
  const [orderBy, setOrderBy] = React.useState<string>('');

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
      const attributesData = response.data.map((attribute: string) => ({
        tableName,
        attributeName: attribute,
      }));
      setAttributes(attributesData);
    } catch (error) {
      console.error('Erro ao buscar atributos:', error);
    }
  };

  const fetchRelationships = async (tableName: string) => {
    try {
      const response = await axios.get<Relationship[]>(`http://localhost:5000/api/table/relationships/${tableName}`);
      setRelationships(response.data);
    } catch (error) {
      console.error('Erro ao buscar relacionamentos:', error);
    }
  };

  const fetchRelatedTableAttributes = async (relatedTable: string) => {
    try {
      const response = await axios.get<string[]>(`http://localhost:5000/api/table/attributes/${relatedTable}`);
      const relatedAttributesData = response.data.map((attribute: string) => ({
        tableName: relatedTable,
        attributeName: attribute,
      }));
      setRelationshipAttributes({
        ...relationshipAttributes,
        [relatedTable]: relatedAttributesData,
      });
    } catch (error) {
      console.error('Erro ao buscar atributos da tabela relacionada:', error);
    }
  };

  const handleTableChange = async (event: SelectChangeEvent<string>) => {
    const tableName = event.target.value;
    setSelectedTable(tableName);
    setTableName(tableName);
    setSelectedAttributes([]);
    setFilters([]);
    setSelectedRelationships([]);
    setRelationshipAttributes({});
    await fetchAttributes(tableName);
    await fetchRelationships(tableName);
  };

  const handleAddFilter = () => {
    setFilters([...filters, { attribute: { tableName: selectedTable, attributeName: '' }, operator: 'equals', value: '' }]);
  };

  const handleFilterChange = (index: number, field: keyof Filter, value: string) => {
    const updatedFilters = [...filters];
    if (field === 'attribute') {
      const selectedAttribute = [...attributes, ...Object.values(relationshipAttributes).flat()].find(attr => attr.attributeName === value);
      if (selectedAttribute) {
        updatedFilters[index][field] = selectedAttribute;
      }
    } else {
      updatedFilters[index][field] = value;
    }
    setFilters(updatedFilters);
  };

  const handleAddRelationship = async (relationship: Relationship) => {
    setSelectedRelationships([...selectedRelationships, relationship.relatedTable]);
    await fetchRelatedTableAttributes(relationship.relatedTable);
  };

  const handleRemoveRelationship = (relatedTable: string) => {
    const updatedRelationships = selectedRelationships.filter(rel => rel !== relatedTable);
    setSelectedRelationships(updatedRelationships);
  };

  const handleGenerateReport = async () => {
    try {
      const relationshipAttrs: { [key: string]: string[] } = {};
      selectedRelationships.forEach(rel => {
        relationshipAttrs[rel] = relationshipAttributes[rel]?.map(attr => attr.attributeName) || [];
      });

      const requestData = {
        tableName: selectedTable,
        filters: filters.map(filter => ({
          tableName: filter.attribute.tableName, // Inclui o nome da tabela no filtro
          field: filter.attribute.attributeName,
          operator: filter.operator,
          value: filter.value,
        })),
        attributes: selectedAttributes,
        relationshipAttributes: relationshipAttrs,
        orderBy: orderBy || undefined,
        limit: limit || undefined,
        relationships: selectedRelationships,
      };

      const response = await axios.post('http://localhost:5000/api/generate-report', requestData);
      setTableData(response.data);
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
    }
  };

  const handleClearSelection = () => {
    setSelectedTable('');
    setSelectedAttributes([]);
    setFilters([]);
    setSelectedRelationships([]);
    setRelationshipAttributes({});
    setLimit('');
    setOrderBy('');
  };

  return (
    <div>
      <FormControl fullWidth>
        <InputLabel id="table-select-label">Tabela</InputLabel>
        <Select
          labelId="table-select-label"
          value={selectedTable}
          onChange={handleTableChange}
        >
          {tables.map(table => (
            <MenuItem key={table} value={table}>
              {table}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {selectedTable && (
        <>
          <FormControl fullWidth>
            <InputLabel id="attributes-select-label">Atributos</InputLabel>
            <Select
              labelId="attributes-select-label"
              multiple
              value={selectedAttributes}
              onChange={event => setSelectedAttributes(event.target.value as string[])}
              renderValue={selected => (selected as string[]).join(', ')}
            >
              {attributes.map(attribute => (
                <MenuItem key={attribute.attributeName} value={attribute.attributeName}>
                  {attribute.attributeName}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Button onClick={handleAddFilter} style={{ marginTop: '1rem' }}>
            Adicionar Filtro
          </Button>
          {filters.map((filter, index) => (
            <div key={index} style={{ marginTop: '1rem' }}>
              <FormControl fullWidth>
                <InputLabel id={`filter-attribute-select-label-${index}`}>Atributo do Filtro</InputLabel>
                <Select
                  labelId={`filter-attribute-select-label-${index}`}
                  value={filter.attribute.attributeName}
                  onChange={event => handleFilterChange(index, 'attribute', event.target.value as string)}
                >
                  {[...attributes, ...Object.values(relationshipAttributes).flat()].map(attribute => (
                    <MenuItem key={attribute.attributeName} value={attribute.attributeName}>
                      {attribute.tableName}: {attribute.attributeName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel id={`filter-operator-select-label-${index}`}>Operador do Filtro</InputLabel>
                <Select
                  labelId={`filter-operator-select-label-${index}`}
                  value={filter.operator}
                  onChange={event => handleFilterChange(index, 'operator', event.target.value as string)}
                >
                  <MenuItem value="equals">Igual a</MenuItem>
                  <MenuItem value="not equals">Diferente de</MenuItem>
                  <MenuItem value="contains">Contém</MenuItem>
                  <MenuItem value="starts with">Começa com</MenuItem>
                  <MenuItem value="ends with">Termina com</MenuItem>
                  <MenuItem value="greater than">Maior que</MenuItem>
                  <MenuItem value="less than">Menor que</MenuItem>
                </Select>
              </FormControl>

              <TextField
                label="Valor do Filtro"
                value={filter.value}
                onChange={event => handleFilterChange(index, 'value', event.target.value)}
              />

              <IconButton onClick={() => {
                const updatedFilters = [...filters];
                updatedFilters.splice(index, 1);
                setFilters(updatedFilters);
              }} style={{ marginLeft: '1rem' }}>
                <ClearIcon />
              </IconButton>
            </div>
          ))}

          <FormControl fullWidth>
            <InputLabel id="relationship-select-label">Relacionamentos</InputLabel>
            <Select
              labelId="relationship-select-label"
              multiple
              value={selectedRelationships}
              onChange={event => {
                const selectedValues = event.target.value as string[];
                const newlyAdded = selectedValues.find(val => !selectedRelationships.includes(val));
                if (newlyAdded) {
                  const relationship = relationships.find(rel => rel.relatedTable === newlyAdded);
                  if (relationship) handleAddRelationship(relationship);
                } else {
                  setSelectedRelationships(selectedValues);
                }
              }}
              renderValue={selected => (selected as string[]).join(', ')}
            >
              {relationships.map(relationship => (
                <MenuItem key={relationship.relatedTable} value={relationship.relatedTable}>
                  {relationship.relation}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {selectedRelationships.map(relatedTable => (
            <FormControl fullWidth key={relatedTable} style={{ marginTop: '1rem' }}>
              <InputLabel id={`relationship-attributes-select-label-${relatedTable}`}>Atributos de {relatedTable}</InputLabel>
              <Select
                labelId={`relationship-attributes-select-label-${relatedTable}`}
                multiple
                value={relationshipAttributes[relatedTable]?.map(attr => attr.attributeName) || []}
                onChange={event => {
                  const selectedValues = event.target.value as string[];
                  setRelationshipAttributes({
                    ...relationshipAttributes,
                    [relatedTable]: selectedValues.map(value => ({
                      tableName: relatedTable,
                      attributeName: value,
                    })),
                  });
                }}
                renderValue={selected => (selected as string[]).join(', ')}
              >
                {relationshipAttributes[relatedTable]?.map(attribute => (
                  <MenuItem key={attribute.attributeName} value={attribute.attributeName}>
                    {attribute.attributeName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          ))}

          <TextField
            label="Limite"
            type="number"
            value={limit}
            onChange={event => setLimit(event.target.value === '' ? '' : parseInt(event.target.value, 10))}
            style={{ width: '50%', marginTop: '1rem' }}
          />

          <FormControl fullWidth>
            <InputLabel id="order-by-select-label">Ordenar por</InputLabel>
            <Select
              labelId="order-by-select-label"
              value={orderBy}
              onChange={event => setOrderBy(event.target.value as string)}
            >
              {attributes.map(attribute => (
                <MenuItem key={attribute.attributeName} value={attribute.attributeName}>
                  {attribute.attributeName}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Button onClick={handleGenerateReport} variant="contained" style={{ marginTop: '1rem' }}>
            Gerar Relatório
          </Button>

          <Button onClick={handleClearSelection} variant="outlined" style={{ marginTop: '1rem', marginLeft: '1rem' }}>
            Limpar Seleção
          </Button>
        </>
      )}
    </div>
  );
};

export default SelectVariants;
