let sizeTablero = 6; // empezamos con un tablero de 6x6 para probar 
let algoritmoSeleccionado = 'A*'; // algoritmo por defecto

function crearTablero(size){
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

// actualizar el tamano del tablero como lo seleccione el usuario
function actualizarSizeTablero() {
    const selecionTamanoTablero = document.getElementById('sizeTablero');
    sizeTablero = parseInt(selecionTamanoTablero.value, 10);
    crearTablero(sizeTablero);
    return sizeTablero;
}

function actualizarAlgoritmo() {
    const selectAlgoritmo = document.getElementById('seleccion-algoritmo');
    algoritmoSeleccionado = selectAlgoritmo.value;
    return algoritmoSeleccionado;
}

// dimensiones actuales del tablero
function getDimensionesTablero() {
    return {
        rows: sizeTablero,
        cols: sizeTablero
    };
}


// inicializacion del juego 

document.addEventListener('DOMContentLoaded', () => {
    const selecionTamanoTablero = document.getElementById('sizeTablero');
    if (selecionTamanoTablero) {
        sizeTablero = parseInt(selecionTamanoTablero.value, 10) || sizeTablero;
        selecionTamanoTablero.addEventListener('change', actualizarSizeTablero);
    }

    const selectAlgoritmo = document.getElementById('seleccion-algoritmo');
    if (selectAlgoritmo) {
        algoritmoSeleccionado = selectAlgoritmo.value || algoritmoSeleccionado;
        selectAlgoritmo.addEventListener('change', actualizarAlgoritmo);
    }
    crearTablero(sizeTablero);



    const btnComenzar = document.getElementById('btnComenzar');
    if (btnComenzar) {
        btnComenzar.addEventListener('click', () => { // comenzamos a resolver el tablero con un algoritmo de busqueda
            const dimensiones = getDimensionesTablero();
            console.log('Comenzando a resolver el tablero de tamaño:', sizeTablero);
        });
    }
});

// open list (nodos por evaluar)
// closed list (los que ya fueron visitados)
/*





*/