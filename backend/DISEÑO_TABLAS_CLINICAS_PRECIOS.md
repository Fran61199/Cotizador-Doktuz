# Diseño de tablas: clínicas y precios

**Semántica:** **Lima** = sede de la clínica en Lima. **Provincia** = sedes en provincia (cada fila en `clinics` es una sede/clínica en provincia).

## Tabla `clinics`

| Columna | Tipo        | Restricciones | Descripción                    |
|---------|-------------|---------------|---------------------------------|
| `id`    | INTEGER     | PK, index     | Identificador único             |
| `name`  | VARCHAR(255)| NOT NULL, UNIQUE | Nombre de la sede/clínica   |

- **Relación**: Una clínica (sede) tiene muchos precios en `prices`.
- **Uso**: En **Sede Lima** se usan precios con `clinic_id` NULL. En **Sedes en provincia** el usuario elige una o más sedes; los precios son los de `prices` con ese `clinic_id`. Si no hay precio para una prueba en esa sede, se usa el mayor precio de esa prueba entre todas las sedes provincia (o Lima como respaldo).

---

## Tabla `prices`

| Columna     | Tipo    | Restricciones | Descripción |
|-------------|---------|---------------|-------------|
| `id`        | INTEGER | PK, index     | Identificador único |
| `test_id`   | INTEGER | FK → tests.id, NOT NULL | Prueba a la que aplica el precio |
| `clinic_id` | INTEGER | FK → clinics.id, **NULL** | NULL = precio **sede Lima**. No NULL = precio **sede en provincia** (esa clínica) |
| `ingreso`   | FLOAT   | NOT NULL, default 0 | Precio tipo Ingreso (S/) |
| `periodico` | FLOAT   | NOT NULL, default 0 | Precio tipo Periódico (S/) |
| `retiro`    | FLOAT   | NOT NULL, default 0 | Precio tipo Retiro (S/) |

- **Constraint único**: `(test_id, clinic_id)` — una sola fila por combinación prueba + clínica (o prueba + Lima cuando `clinic_id` es NULL).
- **Índices** (mínimos para no duplicar):
  - `uq_test_clinic` (único en `test_id`, `clinic_id`): buscar precio de una prueba en una clínica; también sirve para consultas por `test_id` (prefijo izquierdo).
  - `ix_prices_clinic_id`: listar precios de una clínica para todas las pruebas. No se usa índice aparte en `test_id` porque el único compuesto ya lo cubre.
- **Relaciones**: `test` → `Test`, `clinic` → `Clinic` (nullable cuando es Lima).

---

## Esquema relacional (resumen)

```
tests (id, name, category)
  │
  └── prices (test_id, clinic_id, ingreso, periodico, retiro)
        │
        └── clinics (id, name)   [clinic_id NULL = Lima]
```

- **Sede Lima**: Filas en `prices` con `clinic_id = NULL`. Una fila por prueba (precios sede Lima).
- **Sedes en provincia**: Filas en `prices` con `clinic_id` apuntando a `clinics`. Cada sede en provincia puede tener precios distintos para la misma prueba.

---

## Cómo se cargan (seed)

El archivo `app/data/catalog.json` define:

1. **`clinics`**: Lista de nombres de clínicas. El script `seed_db.py` crea una fila en `clinics` por cada nombre.
2. **`tests`**: Cada ítem puede tener:
   - `prices` sin `clinic` → se inserta un precio en `prices` con `clinic_id = NULL` (Lima).
   - `prices` con `"clinic": "Nombre Clínica"` → se inserta un precio en `prices` con `clinic_id` de esa clínica (Provincia).

Tras añadir las 20 clínicas al array `clinics` en `catalog.json`, hay que ejecutar de nuevo el seed para que se creen en la BD:

```bash
cd backend && py -m scripts.seed_db
```

---

## Consultas eficientes (muchas clínicas / muchas pruebas)

- **Catálogo Lima**: una sola consulta con `JOIN tests + prices WHERE clinic_id IS NULL`.
- **Catálogo Provincia** (precios por clínica): 4 consultas en total, sin N+1:
  1. Lista de tests.
  2. Precios de la clínica elegida (`WHERE clinic_id = ?` → índice `ix_prices_clinic_id`).
  3. Máximo por prueba en Provincia (`GROUP BY test_id`, `clinic_id IS NOT NULL`).
  4. Precios Lima (`WHERE clinic_id IS NULL`) como respaldo.
- **Ver precios de una clínica**: `SELECT * FROM prices WHERE clinic_id = ?` (usa `ix_prices_clinic_id`).
- **Ver precios de una prueba en todas las clínicas**: `SELECT * FROM prices WHERE test_id = ?` (usa el índice único `uq_test_clinic` por prefijo izquierdo).
