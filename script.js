// ---------------------------
// Variables y constantes base
// ---------------------------
let sizeTablero = 6; // empezamos con un tablero de 6x6
let algoritmoSeleccionado = 'astar'; // por defecto
let edicionActiva = true; // editar tablero
let rellenoActual = '.';  // símbolo actual
let matrizTablero = [];   // grilla con símbolos
let salidaCoord = null;   // {x,y}
let celdaCanditadaPrev = null;

const SIMBOLOS = ['.','-','|','<','>','v','^','B'];
const CABEZAS = new Set(['>','<','v','^']); // FIX: Set con S mayúscula

// ---------------------------
// Utilidades UI
// ---------------------------

function setEdicion(corriendo){
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
    document.getElementById('etiqueta-SD').textContent = `(${size-1},0)`;
    document.getElementById('etiqueta-II').textContent = `(0,${size-1})`;
    document.getElementById('etiqueta-ID').textContent = `(${size-1},${size-1})`;
}

// actualiza la posicion de la etiqueta de la salida
function setPosicionSalidaEtiqueta(){
    const pos = document.getElementById('posicion-salida');
    if (!pos) return;
    if (!salidaCoord) pos.textContent = 'Salida: ( , )';
    else pos.textContent = `Salida: (${salidaCoord.x}, ${salidaCoord.y})`;
}

// marca visualmente la salida
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
    setEdicion(edicionActiva);
}

function getCelda(x,y){
    return document.querySelector(`.celda[data-x='${x}'][data-y='${y}']`);
}

// renderizador de botones de símbolo
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
            // FIX typo: rellenoActualctual -> rellenoActual
            rellenoActual = simbolo;
            simbolos.querySelectorAll('button').forEach(btn => btn.classList.remove('activo'));
            btnSimbolo.classList.add('activo');
        });
        simbolos.appendChild(btnSimbolo);
    });
}

// matriz NxN con '.'
function Matriz(n) {
    matrizTablero = Array.from({ length: n }, () => Array.from({ length: n }, () => '.'));
}

// crear grilla
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

            celda.addEventListener('click', onClickCelda); // FIX: nombre consistente
            tablero.appendChild(celda);
        }  
    }
    renderizarMarcos(size);
    setEdicion(true);
    setPosicionSalida(null);
    renderizarSimbolos();
}

// ---------------------------
// Entrada textual (agregada)
// ---------------------------
function cargarDesdeTexto(){
  const raw = document.getElementById('txtTablero').value.trim();
  const salidaTxt = document.getElementById('txtSalida').value.trim();
  if(!raw){ return; }
  const rows = raw.split('\n').map(r=>r.trim());
  const m = rows.map(r => r.split(/\s+/)); // permite espacios
  const n = m.length;
  if(n<2 || n>12){ mensajeError("El tablero debe ser entre 2x2 y 12x12."); return; }
  // normalizamos a caracteres individuales (si vienen sin espacios)
  let ancho = Math.max(...m.map(r=>r.length));
  if(ancho===1 && rows[0].length>1){
    // El usuario pegó sin espacios -> tomamos cada char
    matrizTablero = rows.map(r => r.split(''));
  } else {
    matrizTablero = m;
  }
  sizeTablero = matrizTablero.length;
  Matriz(sizeTablero); // reinit (luego lo sobreescribimos)
  matrizTablero = matrizTablero.map(r => r.slice());
  crearTablero(sizeTablero);
  // pintar
  for(let y=0;y<sizeTablero;y++){
    for(let x=0;x<sizeTablero;x++){
      const v = matrizTablero[y][x];
      const c = getCelda(x,y);
      c.textContent = (v==='.')?'':v;
    }
  }
  // salida
  const [sx, sy] = salidaTxt.split(',').map(n => parseInt(n,10));
  if(Number.isFinite(sx) && Number.isFinite(sy)){
    setPosicionSalida({x:sx,y:sy});
  }
  mensajeOk("Tablero cargado desde texto.");
}

// ---------------------------
// Click en celda (editar)
// ---------------------------
function onClickCelda(e){
    if(!edicionActiva) return;
    const x = parseInt(e.currentTarget.dataset.x,10);
    const y = parseInt(e.currentTarget.dataset.y,10);
    matrizTablero[y][x] = rellenoActual;
    e.currentTarget.textContent = (rellenoActual === '.') ? '' : rellenoActual;

    // si colocan B y no hay salida, sugerimos salida a la derecha
    if(rellenoActual === 'B' && !salidaCoord){
        setPosicionSalida({ x: sizeTablero-1, y });
    }
}

// ---------------------------
// Mensajes
// ---------------------------
function mensajeOk(txt){
  document.getElementById('mensajes').innerHTML = `<p class="ok">${txt}</p>`;
}
function mensajeError(txt){
  document.getElementById('mensajes').innerHTML = `<p class="error">${txt}</p>`;
}

// ---------------------------
// Modelo y búsqueda
// ---------------------------

// Representamos cada estado como una matriz de chars.
// Reglas asumidas (simplificadas y coherentes con tu descripción):
// - Autos horizontales: cabeza '>' o '<' (objetivo 'B' se trata como cabeza '>'), cuerpo '-'
// - Autos verticales: cabeza 'v' o '^', cuerpo '|'
// - Se mueven solo en su orientación, si hay '.'

function clonMatriz(m){ return m.map(r=>r.slice()); }

function findB(m){
  for(let y=0;y<m.length;y++){
    for(let x=0;x<m.length;x++){
      if(m[y][x]==='B') return {x,y};
    }
  }
  return null;
}

function hash(m){ return m.map(r=>r.join('')).join('|'); }

function esMeta(m, salida){
  // meta: que B esté en la salida
  return m[salida.y][salida.x] === 'B';
}

// Detecta autos y sus posibles movimientos (1 paso a la vez por simplicidad)
function generarMovimientos(m){
  const n = m.length;
  const movs = [];
  // estrategia: escanear celdas cabeza; calcular orientación y desplazar 1 paso si posible
  for(let y=0;y<n;y++){
    for(let x=0;x<n;x++){
      const c = m[y][x];
      if(c==='B' || CABEZAS.has(c)){
        if(c==='B' || c==='>'){
          // horizontal derecha
          // cabeza en (x,y), cuerpo '-' hacia la izquierda
          const len = longitudCoche(m, x, y, 'H', -1);
          // mover +1 a la derecha si libre
          if(x+1<n && m[y][x+1]==='.'){
            movs.push({ carId:`(${x},${y})`, dir:'der', steps:1, apply:(mm)=>{
              // desplazar todo el coche 1 a la derecha
              for(let i=0;i<len;i++){
                const px = x - i;
                mm[y][px+1] = (i===0 ? c : '-'); // nueva posición
                if(i===len-1) mm[y][px] = '.';   // limpia cola
              }
            }});
          }
          // mover -1 a la izquierda si libre detrás de la cola
          const colaX = x - (len-1);
          if(colaX-1>=0 && m[y][colaX-1]==='.'){
            movs.push({ carId:`(${x},${y})`, dir:'izq', steps:1, apply:(mm)=>{
              // mover cola a la izquierda y arrastrar cabeza
              for(let i=len-1;i>=0;i--){
                const px = x - i;
                mm[y][px-1] = (i===0 ? c : '-');
                if(i===len-1) mm[y][px] = '.';
              }
            }});
          }
        } else if(c==='<'){
          // horizontal izquierda
          const len = longitudCoche(m, x, y, 'H', +1);
          if(x-1>=0 && m[y][x-1]==='.'){
            movs.push({ carId:`(${x},${y})`, dir:'izq', steps:1, apply:(mm)=>{
              for(let i=0;i<len;i++){
                const px = x + i;
                mm[y][px-1] = (i===0 ? c : '-');
                if(i===len-1) mm[y][px] = '.';
              }
            }});
          }
          const colaX = x + (len-1);
          if(colaX+1<n && m[y][colaX+1]==='.'){
            movs.push({ carId:`(${x},${y})`, dir:'der', steps:1, apply:(mm)=>{
              for(let i=len-1;i>=0;i--){
                const px = x + i;
                mm[y][px+1] = (i===0 ? c : '-');
                if(i===len-1) mm[y][px] = '.';
              }
            }});
          }
        } else if(c==='v'){
          // vertical hacia abajo
          const len = longitudCoche(m, x, y, 'V', -1);
          if(y+1<n && m[y+1][x]==='.'){
            movs.push({ carId:`(${x},${y})`, dir:'aba', steps:1, apply:(mm)=>{
              for(let i=0;i<len;i++){
                const py = y - i;
                mm[py+1][x] = (i===0 ? c : '|');
                if(i===len-1) mm[py][x] = '.';
              }
            }});
          }
          const colaY = y - (len-1);
          if(colaY-1>=0 && m[colaY-1][x]==='.'){
            movs.push({ carId:`(${x},${y})`, dir:'arr', steps:1, apply:(mm)=>{
              for(let i=len-1;i>=0;i--){
                const py = y - i;
                mm[py-1][x] = (i===0 ? c : '|');
                if(i===len-1) mm[py][x] = '.';
              }
            }});
          }
        } else if(c==='^'){
          // vertical hacia arriba
          const len = longitudCoche(m, x, y, 'V', +1);
          if(y-1>=0 && m[y-1][x]==='.'){
            movs.push({ carId:`(${x},${y})`, dir:'arr', steps:1, apply:(mm)=>{
              for(let i=0;i<len;i++){
                const py = y + i;
                mm[py-1][x] = (i===0 ? c : '|');
                if(i===len-1) mm[py][x] = '.';
              }
            }});
          }
          const colaY = y + (len-1);
          if(colaY+1<n && m[colaY+1][x]==='.'){
            movs.push({ carId:`(${x},${y})`, dir:'aba', steps:1, apply:(mm)=>{
              for(let i=len-1;i>=0;i--){
                const py = y + i;
                mm[py+1][x] = (i===0 ? c : '|');
                if(i===len-1) mm[py][x] = '.';
              }
            }});
          }
        }
      }
    }
  }
  return movs;
}

// calcula longitud del auto desde la cabeza recorriendo cuerpo '-' o '|'
function longitudCoche(m, hx, hy, tipo, dirSign){
  let len = 1; // incluye cabeza
  if(tipo==='H'){
    let x = hx + dirSign;
    while(x>=0 && x<m.length && m[hy][x]==='-'){ len++; x += dirSign; }
  } else {
    let y = hy + dirSign;
    while(y>=0 && y<m.length && m[y][hx]==='|'){ len++; y += dirSign; }
  }
  return Math.max(len, 2); // el enunciado dice 2-3+ (cabeza+2 cuerpos mínimo)
}


// Aplicar movimiento (pura) sobre matriz clonada
function aplicarMovimiento(m, move){
  const mm = clonMatriz(m);
  move.apply(mm);
  // Normaliza: si movimos cabeza B, mantenemos 'B' como cabeza (puede haberse copiado como '-')
  // Re-buscar B (si se movió) — en esta versión, si B era cabeza con dir derecha, queda en la nueva cabeza
  // (ya gestionado por apply con (i===0 ? c : '-'))
  return mm;
}

// Backtracking (DFS con retroceso)
function resolverBacktracking(m0, salida, limite=10000){
  const visit = new Set();
  const path = [];
  let explorados = 0;
  let solucion = null;

  function dfs(m){
    const h = hash(m);
    if(visit.has(h)) return false;
    visit.add(h);
    explorados++;

    if(esMeta(m, salida)){ solucion = path.slice(); return true; }
    if(visit.size > limite) return false;

    const movs = generarMovimientos(m);
    for(const mv of movs){
      const m2 = aplicarMovimiento(m, mv);
      path.push(mv);
      if(dfs(m2)) return true;
      path.pop();
    }
    return false;
  }
  dfs(m0);
  return { moves: solucion, explored: explorados };
}



function pintarMetricas({elapsedMs, explored, moves}){
  document.getElementById('metricas').innerHTML = `
    <ul>
      <li><strong>Tiempo:</strong> ${elapsedMs.toFixed(2)} ms</li>
      <li><strong>Estados explorados:</strong> ${explored}</li>
      <li><strong>Movimientos solución:</strong> ${moves?.length ?? 0}</li>
    </ul>
  `;
}

function listarAcciones(moves){
  const cont = document.getElementById('acciones');
  if(!moves || !moves.length){ cont.innerHTML = `<p>No se encontró solución.</p>`; return; }
  cont.innerHTML = `<ol>${moves.map(m=>`<li>mover carro ${m.carId} ${m.dir} ${m.steps} paso(s)</li>`).join('')}</ol>`;
}

async function animarSolucion(m, moves){
  const tablero = document.getElementById('tablero');
  for(const mv of moves){
    m = aplicarMovimiento(m, mv);
    // repintar
    tablero.innerHTML = '';
    tablero.style.gridTemplateColumns = `repeat(${m.length}, 1fr)`;
    tablero.style.gridTemplateRows = `repeat(${m.length}, 1fr)`;
    for(let y=0;y<m.length;y++){
      for(let x=0;x<m.length;x++){
        const d = document.createElement('div');
        d.className = 'celda';
        d.dataset.x = x; d.dataset.y = y;
        const v = m[y][x];
        d.textContent = (v==='.')? '' : v;
        tablero.appendChild(d);
      }
    }
    await new Promise(r=>setTimeout(r, 250));
  }
}

function validarBasico(){
  // tamaño
  if(matrizTablero.length<2 || matrizTablero.length>12) { mensajeError('El tablero debe ser entre 2x2 y 12x12.'); return false; }
  // hay exactamente una B
  let b=0; 
  for(let y=0;y<matrizTablero.length;y++){
    for(let x=0;x<matrizTablero.length;x++){
      const v = matrizTablero[y][x];
      if(!'.-|><vB^'.includes(v)){ mensajeError(`Símbolo inválido "${v}" en (${x},${y}).`); return false; }
      if(v==='B') b++;
    }
  }
  if(b!==1){ mensajeError('Debe existir exactamente un carro objetivo (B).'); return false; }
  if(!salidaCoord){ mensajeError('Falta la salida.'); return false; }
  if(salidaCoord.x<0 || salidaCoord.y<0 || salidaCoord.x>=matrizTablero.length || salidaCoord.y>=matrizTablero.length){
    mensajeError('Salida inválida.'); return false;
  }
  return true;
}

async function comenzar(){
  if(!validarBasico()) return;

  setEdicion(false);
  mensajeOk('Resolviendo…');

  const inicio = performance.now();
  let resultado = null;

  if(algoritmoSeleccionado === 'backtracking'){
    resultado = resolverBacktracking(matrizTablero, salidaCoord);
  } else {
    resultado = resolverAStar(matrizTablero, salidaCoord);
  }
  const fin = performance.now();

  pintarMetricas({ elapsedMs: fin-inicio, explored: resultado.explored || 0, moves: resultado.moves });
  listarAcciones(resultado.moves);

  if(resultado.moves && resultado.moves.length){
    await animarSolucion(matrizTablero, resultado.moves);
    mensajeOk('¡Listo!');
  } else {
    mensajeError('No hay solución.');
  }

  setEdicion(true);
}


// Inicialización (mantengo tu flujo)


function actualizarSizeTablero() {
    const selecionTamanoTablero = document.getElementById('sizeTablero');
    sizeTablero = parseInt(selecionTamanoTablero.value, 10);
    Matriz(sizeTablero);
    crearTablero(sizeTablero);
    return sizeTablero;
}

function actualizarAlgoritmo() {
    const selectAlgoritmo = document.getElementById('seleccion-algoritmo');
    algoritmoSeleccionado = selectAlgoritmo.value;
    return algoritmoSeleccionado;
}

function getDimensionesTablero() {
    return { rows: sizeTablero, cols: sizeTablero };
}

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

    // Inicializa matriz ANTES de crear tablero (fix)
    Matriz(sizeTablero);
    crearTablero(sizeTablero);

    const btnComenzar = document.getElementById('btnComenzar');
    if (btnComenzar) {
        btnComenzar.addEventListener('click', comenzar);
    }

    // NUEVO: botones de texto + confirmar/editar/reiniciar como ya tenías
    const btnCargar = document.getElementById('btnCargarTexto');
    if(btnCargar) btnCargar.addEventListener('click', cargarDesdeTexto);

    const btnEditar = document.getElementById('btnEditar');
    if(btnEditar) btnEditar.addEventListener('click', ()=> setEdicion(true));

    const btnConfirmar = document.getElementById('btnConfirmar');
    if(btnConfirmar) btnConfirmar.addEventListener('click', ()=> setEdicion(false));

    const btnReiniciar = document.getElementById('btnReiniciar');
    if(btnReiniciar) btnReiniciar.addEventListener('click', ()=>{
      Matriz(sizeTablero);
      crearTablero(sizeTablero);
      setPosicionSalida(null);
      document.getElementById('metricas').innerHTML='';
      document.getElementById('acciones').innerHTML='';
      document.getElementById('mensajes').innerHTML='';
      document.getElementById('txtTablero').value='';
      document.getElementById('txtSalida').value='';
    });
});