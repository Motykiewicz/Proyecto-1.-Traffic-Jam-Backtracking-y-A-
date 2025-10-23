/* Para iniciar se tenia planteado que el usuario elige el tamano del tablero
elige adonde posicionar los carros (incluyendo el carro objetivo) y su orientacion. La salida aparece
cuando ya tiene todo listo se da al boton de confirmar, las flechas se le pintan en cuadros para que simulen
mas el comportamiento de un carro.

si hace falta el usuario puede darle al boton de editar para cambiar algo y si ya esta todo listo
le da al boton de confirmar nuevamente y luego el de comenzar. ya teniendo los carros puestos
el carro objetivo, el tamano del tablero y el algoritmo a elegir, puede ejecutarse 
el programa. 

Hay varias medidas ya implementadas para prevenir errores, como la implementacion de un carro objetivo
unicamente debe haber uno y sin ese no se puede comenzar. Tiene que haber una salida tambien que esta posicionada
adonde se ubique la cabeza del carro objetivo (B), para evitar complicaciones es mas facil 
colocar primero el carro objetivo y luego la salida. 

 
*/


// unas variables globales utilizadas a travez del script

let sizeTablero = 6; // empezamos con un tablero de 6x6 para probar 
let algoritmoSeleccionado = 'A*'; // algoritmo por defecto
let edicionActiva = true; // esta habilitado la opcion para editar el tablero
let rellenoActual = '.'; // con lo que se llena la celda 
let matrizTablero = []; // aqui iremos colocando todos los simbolos
let salidaCoord = null; // coordenadas de la salida para tenerlo presente, asignado junto con el carro objetivo
let celdaCanditadaPrev = null; // celda para la salida que se pintara de un color 

const SIMBOLOS = ['.','-','|','<','>','v','^','B'];
const CABEZAS = new set(['>','<','v','^']);


// mientras que el usuario este editando el tablero, realice lo siguiente.
function setEdicion(corriendo){
    // bloquee todos los botones menos confirmar hasta que haya una salida, que se pone cuando ya este el carro objetivo
    edicionActiva = corriendo;
    document.querySelectorAll('.celda').forEach(celda => {celda.classList.toggle('no-edicion', !edicionActiva);});

    const btnEditar = document.getElementById('btnEditar');
    const btnConfirmar = document.getElementById('btnConfirmar');
    const sizeTab = document.getElementById('sizeTablero');

    if (btnEditar) btnEditar.disabled = edicionActiva;
    if (btnConfirmar) btnConfirmar.disabled = !edicionActiva || (salidaCoord === null);
    if (sizeTab) sizeTab.disabled = edicionActiva; 
}

// maneja el tamano del tablero mediante las esquinas. 
function renderizarMarcos(size){
    document.getElementById('etiqueta-SI').textContent = `(0,0)`;
    document.getElementById('etiqueta-SD').textContent = `(${size-1},0,)`;
    document.getElementById('etiqueta-II').textContent = `(0,${size-1})`;
    document.getElementById('etiqueta-ID').textContent = `(${size-1},${size-1})`;

}

// actualiza la posicion de la etiqueda de la salida en la interfaz
function setPosicionSalidaEtiqueta(){
    const pos = document.getElementById('posicion-salida');
    if (!pos) return;
    if (!salidaCoord) pos.textContent = 'Salida: ( , )';
    else pos.textContent = `Salida: (${salidaCoord.y}, ${salidaCoord.x})`;
}

// actualiza la posicion de la salida en la tabla. 
function setPosicionSalida(coord){
    if (celdaCanditadaPrev){
        celdaCanditadaPrev.classList.remove('salida-auto');
        celdaCanditadaPrev = null;
    }
    salidaCoord = coord;
    if (coord){
        const pos = getCelda(coord.x, coord.y);
        if (pos){
            pos.classList.add('salida-auto');
            celdaCanditadaPrev = pos;
        }
    }
    setPosicionSalidaEtiqueta();
    setEdicion(edicionActiva); // actualiza el estado de los botones previamente desactivados. 
}

function getCelda(x,y){
    return document.querySelector(`.celda[data-x='${x}'][data-y='${y}']`);
}


/*
la funcion renderizarSimbolos basicamente 
*/

// se van colocando los simbolos debidamente en el tablero hasta que el usuario este satisfecho 
function renderizarSimbolos(){
    const simbolos = document.getElementById('simbolos');
    if (!simbolos) return;
    simbolos.innerHTML = '';

    SIMBOLOS.forEach(simbolo => {
        const btnSimbolo = document.createElement('button');
        btnSimbolo.type = 'button';
        btnSimbolo.className = 'btn-simbolo' + (simbolo === rellenoActual ? ' activo' : '');
        btnSimbolo.textContent = simbolo;
        btnSimbolo.title = `Simbolo: ${simbolo}`;
        btnSimbolo.addEventListener('click', () => {
            rellenoActualctual = simbolo;
            simbolos.querySelectorAll('button').forEach(btn => btn.classList.remove('activo'));
            btnSimbolo.classList.add('activo');
        });
        simbolos.appendChild(btnSimbolo);
        });
    }

// se crea la matriz con el tamanao del tablero y con puntos vacios
function Matriz(n) {
    matrizTablero = Array.from({ length: n }, () => Array.from({ length: n }, () => '.'));
}


function crearTablero(size){
    const tablero = document.getElementById('tablero');

    tablero.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
    tablero.style.gridTemplateRows = `repeat(${size}, 1fr)`;
    tablero.innerHTML = '';
    
    for (let y=0; y < size; y++) {
        for (let x=0; x < size; x++) {
            const celda = document.createElement('div');
            celda.className = 'celda';
            celda.dataset.x = x;
            celda.dataset.y = y;
            const matriz = matrizTablero[y][x];
            celda.textContent = (matriz === '.') ? '' : matriz;

            celda.addEventListener('click', onClickCelda);
            tablero.appendChild(celda);
        }  

    }
    renderizarMarcos(size);
    setEdicion(true);
    setPosicionSalida(null);
    renderizarSimbolos();
}

function obtenerOrientacion () // buscar los carros, el carro objetivo y anotar adonde estan apuntando (carro 1 a la derecha fila 4, etc)
{
    const carros = [];
    let carroObjetivo = null;


}


function calcularSalida() (

) // dependiendo de la posicion del carro objetivo y su orientacion, se calcula la salida



function clickCelda() { // verifica si se hizo click en la celda para editarla

}

// funcion que unicamente permite el ingreso de los simbolos en el tablero 

// function que verifique que todo este listo para empezar 

// funcion que convierta los cuadros de los carros en diferentes colores para repreesentarlos mejor

// funcion para el algoritmo backtracking

// funcion para el algoritmo A*










/* funcuones viejas, pueden servir para guiarse

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

*/
// open list (nodos por evaluar)
// closed list (los que ya fueron visitados)
/*





*/