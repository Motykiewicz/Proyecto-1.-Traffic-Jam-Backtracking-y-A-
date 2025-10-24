
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
let modoElegirObjetivo = false;
let highlightActual = [];

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

    if (btnEditar) btnEditar.disabled = edicionActiva;
    if (btnConfirmar) btnConfirmar.disabled = !edicionActiva;
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

// vamos a comprobar si en el tablero hay carros que no esten completos como dos piezas sin cabeza o asi 
function EscanearCarros(){
  const largo = matrizTablero.length;
  const carrosIncompletos = [];
  const errores = [];

  // primero verifiquemos los carros horizontales 
  for(let y=0; y<largo; y++){
    let x=0;
    while(x<largo){
      if (matrizTablero[y][x] === '>' || matrizTablero[y][x] === '<'){
        let x0 = x; // definimos x0 como la posicion inicial del carro 
        while (x+1 < largo && matrizTablero[y][x+1]==='-') x++;
        let x1 = x; // definimos x1 como la posicion final del carro

        // al tener listo la posicion del carro vemos si una de las dos cabezas 
        const tieneIzquierda = (x0 > 0 && matrizTablero[y][x0-1] === '<'); 
        const tieneDerecha = (x1 < largo-1 && matrizTablero[y][x1+1] === '>');

        // si nos las tiene le notificamos al usuario 
        if (!tieneIzquierda && !tieneDerecha){
          carrosIncompletos.push(`Carro horizontal incompleto en fila ${y}, columnas ${x0} a ${x1}`);
        }
        else if (tieneIzquierda && tieneDerecha){
          errores.push(`Error: Carro horizontal con dos cabezas en fila ${y}, columnas ${x0-1} a ${x1+1}`);
        }
      }
      x++;
    }
  }

  // ahora verificamos los carros verticales (repetimos la logica)
  for (let x=0; x<largo; x++){
    let y=0;
    while(y<largo){
      if (matrizTablero[y][x] === '|'){
        let y0 = y; // definimos y0 como la posicion inicial del carro
        while (y+1 < largo && matrizTablero[y+1][x]==='|') y++;
        let y1 = y; // definimos y1 como la posicion final del carro

        const tieneArriba = (y0 > 0 && matrizTablero[y0-1][x] === '^');
        const tieneAbajo = (y1 < largo-1 && matrizTablero[y1+1][x] === 'v');

        if (!tieneArriba && !tieneAbajo){
          carrosIncompletos.push(`Carro vertical incompleto en columna ${x}, filas ${y0} a ${y1}`);
        }
        else if (tieneArriba && tieneAbajo){
          errores.push(`Error: Carro vertical con dos cabezas en columna ${x}, filas ${y0-1} a ${y1+1}`);
        }
      }
      y++;
    }
  }

  return { carrosIncompletos, errores };

}

// cuando escojemos el carro objetivo reemplazamos su cabeza por 'B'
function limpiarObjetivoCabeza(lista){
  document.querySelectorAll('.cabeza-objetivo')
  .forEach(elem => elem.classList.remove('cabeza-objetivo'));
}


// marca las cabeza del objetivo en el tablero
function marcarCabezaObjetivo(lista){
  limpiarObjetivoCabeza();
  lista.forEach(({x,y}) => {
    const celda = getCelda(x,y);
    if(celda) celda.classList.add('cabeza-objetivo');
  });
}

// con esta funcion podremos ubicar un carro completo en el tablero (para cada carro) para escoger el carro objetivo
function obtenerCarros(){
  const matriz = matrizTablero[y][x];
  const tamano = sizeTablero;

  // buscamos primero los carros horizontales
  // iniciamos buscandos en cada fila las cabezas
  if (matriz === '>' || matriz === '<'){
    const direccion = (matriz === '>') ? -1 : +1; // definimos la direccion del cuerpo del carro, por ejemplo si la cabez esta asi > sabemos que el cuerpo va a la izq
    const celdas = [[x,y]]; // guardamos la posicion de la cabeza
    let nx = x + direccion;
    while (nx >=0 && nx < tamano && matrizTablero[y][nx] === '-'){ // verificamos mientras no salgamos del tablero y hasta el final del cuerpo
      celdas.push([nx,y]); // cuardamos la posicion de la cabeza
      nx += direccion;
    }
    return { orientacion: 'H', cabeza: {x,y}, numeroCabezas:1, celdas }; // retornamos la informacion del carro y con el numero de cabezas podemos verificar si es valido el carro
  }

  // ahora buscamos los carros verticales (mismo procedimiento)
  if (matriz === 'v' || matriz === '^'){
    const direccion = (matriz === 'v') ? -1 : +1; // definimos la direccion del cuerpo del carro
    const celdas = [[x,y]]; // guardamos la posicion de la cabeza
    let ny = y + direccion;
    while (ny >=0 && ny < tamano && matrizTablero[ny][x] === '|'){ // verificamos mientras no salgamos del tablero y hasta el final del cuerpo
      celdas.push([x,ny]); // cuardamos la posicion de la cabeza
      ny += direccion;
    }
    return { orientacion: 'V', cabeza: {x,y}, numeroCabezas:1, celdas }; // retornamos la informacion del carro y con el numero de cabezas podemos verificar si es valido el carro
  }

  // ya que tenemos las cabezas y los carros queremos poder reconocer los cuerpos de todos los carros para marcarlos si el usuario los pasa por encima (highlight)
  // empecemos por los carros horizontales
  if (matriz === '-'){
    let x0 = x;
    let x1 = x;
    
    while (x0 - 1 >= 0 && matrizTablero[y][x0 - 1] === '-') x0--; // retrocedemos hasta encontrar la cabeza
    while (x1 + 1 < tamano && matrizTablero[y][x1 + 1] === '-') x1++; // o avanzamos hasta encontrar la cabeza

    const cabezaIzq = (x0 - 1 >= 0 && (matrizTablero[y][x0 - 1] === '<') ? {x: x0 - 1, y} : null); // verificamos si hay cabeza a la izquierda
    const cabezaDer = (x1 + 1 < tamano && (matrizTablero[y][x1 + 1] === '>') ? {x: x1 + 1, y} : null); // verificamos si hay cabeza a la derecha
    const celdas = []; 
    for(let xx = x0; xx <= x1; xx++) celdas.push([xx,y]); // guardamos cada una de las posiciones desde la cabeza hasta el final del cuerpo 
    if (cabezaIzq) celdas.push([cabezaIzq.x, cabezaIzq.y]);
    if (cabezaDer) celdas.push([cabezaDer.x, cabezaDer.y]);
    const numeroCabezas = (cabezaIzq ? 1 : 0) + (cabezaDer ? 1 : 0);
    return { orientacion: 'H', cabeza: cabezaIzq || cabezaDer, numeroCabezas, celdas }; // retornamos la informacion del carro

  }

  // por ultimo los carros verticales
  if (matriz === '|'){
    let y0 = y;
    let y1 = y;

    while (y0 - 1 >= 0 && matrizTablero[y0 - 1][x] === '|') y0--; // retrocedemos hasta encontrar la cabeza
    while (y1 + 1 < tamano && matrizTablero[y1 + 1][x] === '|') y1++; // o avanzamos hasta encontrar la cabeza

    const cabezaArr = (y0 - 1 >= 0 && (matrizTablero[y0 - 1][x] === '^') ? {x, y: y0 - 1} : null); // verificamos si hay cabeza arriba
    const cabezaAba = (y1 + 1 < tamano && (matrizTablero[y1 + 1][x] === 'v') ? {x, y: y1 + 1} : null); // verificamos si hay cabeza abajo
    const celdas = [];
    for(let yy = y0; yy <= y1; yy++) celdas.push([x,yy]); // guardamos cada una de las posiciones desde la cabeza hasta el final del cuerpo
    if (cabezaArr) celdas.push([cabezaArr.x, cabezaArr.y]);
    if (cabezaAba) celdas.push([cabezaAba.x, cabezaAba.y]);
    const numeroCabezas = (cabezaArr ? 1 : 0) + (cabezaAba ? 1 : 0);
    return { orientacion: 'V', cabeza: cabezaArr || cabezaAba, numeroCabezas, celdas }; // retornamos la informacion del carro
  }

}

function quitarHighlight(){
  highlightActual.forEach(elemento => elemento.classList.remove('car-highlight'));
  highlightActual = [];
}

function resaltarCarro(celdas){
  quitarHighlight();
  celdas.forEach(([x,y]) => {
    const celda = getCelda(x,y);
    if(celda){ 
      celda.classList.add('car-highlight');
      highlightActual.push(celda);
    }
  });
}

function confirmarTablero(){
  document.querySelectorAll('.celda').forEach(celda => {
    const x = parseInt(celda.dataset.x,10);
    const y = parseInt(celda.dataset.y,10);
    matrizTablero[y][x] = celda.textContent || '.';
  });

  const { carrosIncompletos, errores } = EscanearCarros();
  if (errores.length || carrosIncompletos.length){
    const msg = [];
    if (carrosIncompletos.length) msg.push(`Carros incompletos:\n- ${carrosIncompletos.join('\n- ')}`);

    const btnComenzar = document.getElementById('btnComenzar'); 
    const btnElegirObjetivo = document.getElementById('btnElegirObjetivo');
    if (btnComenzar) btnComenzar.disabled = true;
    if (btnElegirObjetivo) btnElegirObjetivo.disabled = true;
    return;
  }

  limpiarObjetivoCabeza();
  setEdicion(false);
  mensajeOk("Tablero confirmado. Listo para resolver.");
  const btnElegirObjetivo = document.getElementById('btnElegirObjetivo');
  if (btnElegirObjetivo) btnElegirObjetivo.disabled = false;

  const btnComenzar = document.getElementById('btnComenzar');
  if (btnComenzar) btnComenzar.disabled = true;
  }


function activarModoElegirObjetivo(){
  modoElegirObjetivo = true;
  document.getElementById('tablero').classList.add('modo-elegir-objetivo');
  mensajeOk("Modo elegir objetivo activo. Haga clic en la cabeza del carro objetivo.");
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

// Heurística A*: distancia de B a salida + bloqueos directos delante de B
function heuristica(m, salida){
  const b = findB(m);
  if(!b) return 0;
  // asumimos B horizontal hacia la derecha
  let dist = Math.max(0, salida.x - b.x);
  let bloqueos = 0;
  for(let x=b.x+1; x<=salida.x; x++){
    if(m[b.y][x] !== '.') bloqueos++;
  }
  return dist + bloqueos*2;
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

// A* estándar con PQ mínima
class PQ {
  constructor(){ this.a=[]; }
  push(x){ this.a.push(x); this._up(this.a.length-1); }
  pop(){ const a=this.a; const top=a[0]; const last=a.pop(); if(a.length){ a[0]=last; this._down(0); } return top; }
  isEmpty(){ return this.a.length===0; }
  _up(i){ const a=this.a; while(i>0){ const p=(i-1)>>1; if(a[p].f <= a[i].f) break; [a[p],a[i]]=[a[i],a[p]]; i=p; } }
  _down(i){ const a=this.a; for(;;){ let l=i*2+1, r=l+1, m=i; if(l<a.length&&a[l].f<a[m].f) m=l; if(r<a.length&&a[r].f<a[m].f) m=r; if(m===i) break; [a[i],a[m]]=[a[m],a[i]]; i=m; } }
}

function resolverAStar(m0, salida, limite=200000){
  const startKey = hash(m0);
  const g = new Map([[startKey,0]]);
  const came = new Map(); // key -> {prev, move}
  const open = new PQ();
  open.push({ f: heuristica(m0, salida), key: startKey, m: m0 });

  const visit = new Set();
  let explorados = 0;

  while(!open.isEmpty()){
    const cur = open.pop();
    if(visit.has(cur.key)) continue;
    visit.add(cur.key);
    explorados++;

    if(esMeta(cur.m, salida)){
      // reconstruir
      const camino = [];
      let k = cur.key;
      while(came.has(k)){
        const {prev, move} = came.get(k);
        camino.push(move);
        k = prev;
      }
      camino.reverse();
      return { moves: camino, explored: explorados };
    }
    if(visit.size > limite) break;

    const movs = generarMovimientos(cur.m);
    for(const mv of movs){
      const m2 = aplicarMovimiento(cur.m, mv);
      const nk = hash(m2);
      const tentative = (g.get(cur.key) ?? Infinity) + 1;
      if(tentative < (g.get(nk) ?? Infinity)){
        g.set(nk, tentative);
        came.set(nk, { prev: cur.key, move: mv });
        const f = tentative + heuristica(m2, salida);
        open.push({ f, key: nk, m: m2 });
      }
    }
  }
  return { moves: null, explored: explorados };
}

// ---------------------------
// UI: iniciar, animar, métricas
// ---------------------------
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

// ---------------------------
// Inicialización (mantengo tu flujo)
// ---------------------------

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
