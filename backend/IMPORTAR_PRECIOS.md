# Importación de precios

## Formato del CSV

Archivo con **coma** como separador y **primera fila = encabezados**:

| Columna   | Descripción |
|-----------|-------------|
| `prueba`  | Nombre de la prueba (ej. "Marihuana cualitativo"). |
| `categoria` | Categoría (ej. "Laboratorio"). Si la prueba no existe, se crea. |
| `clinica` | Ver abajo. |
| `ingreso` | Precio tipo Ingreso (S/). |
| `periodico` | Precio tipo Periódico (S/). |
| `retiro`  | Precio tipo Retiro (S/). |

### Valores de `clinica`

| Valor | Efecto |
|-------|--------|
| **Lima** o vacío | Precio para **Lima** (sede Lima). Pon "Lima" o deja la celda vacía. |
| **TODAS** o **\*** | Ese precio se aplica a **todas** las sedes en provincia (una fila por cada sede). |
| Nombre de clínica | Solo esa sede en provincia (debe existir en la BD). |

Las sedes en provincia que **no** tengan precio para una prueba usan en la app el **mayor** precio de esa prueba entre todas las sedes (o sede Lima como respaldo).

---

## Ejemplos

### Marihuana cualitativo para todas las sedes en provincia (mismo precio)

```csv
prueba,categoria,clinica,ingreso,periodico,retiro
Marihuana cualitativo,Laboratorio,TODAS,50,50,50
```

Una sola fila: se crean precios para cada sede en provincia con 50/50/50. Si luego quieres que una sede tenga otro precio, importas otra fila con ese nombre.

### Solo algunas sedes en provincia (las demás toman el mayor)

```csv
prueba,categoria,clinica,ingreso,periodico,retiro
Marihuana cualitativo,Laboratorio,Clínica Central,48,48,48
Marihuana cualitativo,Laboratorio,San Juan,52,52,52
```

Solo esas sedes tienen precio; el resto usarán 52 (el mayor) para esa prueba.

### Precio sede Lima + sedes en provincia

```csv
prueba,categoria,clinica,ingreso,periodico,retiro
Marihuana cualitativo,Laboratorio,Lima,55,55,55
Marihuana cualitativo,Laboratorio,TODAS,50,50,50
```

Sede Lima = 55. Todas las sedes en provincia = 50 (o filas sueltas por sede si quieres precios distintos).

---

## Cómo ejecutar

Desde la carpeta **backend**:

```bash
py -m scripts.import_prices ruta/al_archivo.csv
```

Prueba sin guardar (solo valida y muestra errores):

```bash
py -m scripts.import_prices ruta/al_archivo.csv --dry-run
```

- Si la **prueba** no existe, se crea (con la categoría indicada).
- Si la **clínica** no existe (cuando no es Lima ni TODAS), se reporta error y esa fila se omite.
- Precios existentes para el mismo (prueba, clínica) se **actualizan**.
