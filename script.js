let sizeTablero = 6;              // tablero 6x6 por defecto
let algoritmoSeleccionado = 'astar'; // 'bfs' | 'dfs' | 'astar'

function crearTablero(size) {
  const tablero = document.getElementById('tablero');
  if (!tablero) return;

  tablero.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
  tablero.style.gridTemplateRows = `repeat(${size}, 1fr)`;

  tablero.innerHTML = '';
  const celdasTotales = size * size;
  for (let i = 0; i < celdasTotales; i++) {
    const celda = document.createElement('div');
    celda.classList.add('celda');
    tablero.appendChild(celda);
  }
}

// tamaño seleccionado por el usuario
function actualizarSizeTablero() {
  const seleccionTamanoTablero = document.getElementById('sizeTablero');
  sizeTablero = parseInt(seleccionTamanoTablero.value, 10);
  crearTablero(sizeTablero);
  return sizeTablero;
}

// algoritmo seleccionado por el usuario
function actualizarAlgoritmo() {
  const selectAlgoritmo = document.getElementById('seleccion-algoritmo');
  algoritmoSeleccionado = selectAlgoritmo.value; // 'bfs' | 'dfs' | 'astar'
  return algoritmoSeleccionado;
}

// dimensiones actuales del tablero
function getDimensionesTablero() {
  return { rows: sizeTablero, cols: sizeTablero };
}

// inicialización
document.addEventListener('DOMContentLoaded', () => {
  const seleccionTamanoTablero = document.getElementById('sizeTablero');
  if (seleccionTamanoTablero) {
    sizeTablero = parseInt(seleccionTamanoTablero.value, 10) || sizeTablero;
    seleccionTamanoTablero.addEventListener('change', actualizarSizeTablero);
  }

  const selectAlgoritmo = document.getElementById('seleccion-algoritmo');
  if (selectAlgoritmo) {
    algoritmoSeleccionado = selectAlgoritmo.value || algoritmoSeleccionado;
    selectAlgoritmo.addEventListener('change', actualizarAlgoritmo);
  }

  crearTablero(sizeTablero);

  const btnComenzar = document.getElementById('btnComenzar');
  if (btnComenzar) {
    btnComenzar.addEventListener('click', () => {
      const dims = getDimensionesTablero();
      console.log(`Algoritmo: ${algoritmoSeleccionado} | Tablero: ${dims.rows}x${dims.cols}`);
      alert(`Resolviendo con ${algoritmoSeleccionado.toUpperCase()} un tablero ${dims.rows}x${dims.cols}`);
      // TODO: llamar a tu solver: resolver(algoritmoSeleccionado, dims, estadoInicial);
    });
  }
});
