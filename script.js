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
let headCharSeleccionado = null;

const SIMBOLOS = ['.','-','|','<','>','v','^'];
const CABEZAS = new Set(['>','<','v','^']);
const VALIDOS = new Set(['.','-','|','<','>','v','^','B']);

// ---------------------------
// Utilidades UI
// ---------------------------

function setEdicion(corriendo){
  edicionActiva = corriendo;
  document.querySelectorAll('.celda')
    .forEach(celda => celda.classList.toggle('no-edicion', !edicionActiva));

  const btnEditar = document.getElementById('btnEditar');
  const btnConfirmar = document.getElementById('btnConfirmar');
  const btnElegirObjetivo = document.getElementById('btnElegirObjetivo');

  if (btnEditar) btnEditar.disabled = edicionActiva;
  if (btnConfirmar) btnConfirmar.disabled = !edicionActiva;
  if (btnElegirObjetivo) btnElegirObjetivo.disabled = edicionActiva; // sólo tras confirmar
}

function renderizarMarcos(size){
  document.getElementById('etiqueta-SI').textContent = `(0,0)`;
  document.getElementById('etiqueta-SD').textContent = `(${size-1},0)`;
  document.getElementById('etiqueta-II').textContent = `(0,${size-1})`;
  document.getElementById('etiqueta-ID').textContent = `(${size-1},${size-1})`;
}

function setPosicionSalidaEtiqueta(){
  const pos = document.getElementById('posicion-salida');
  if (!pos) return;
  if (!salidaCoord) pos.textContent = 'Salida: ( , )';
  else pos.textContent = `Salida: (${salidaCoord.x}, ${salidaCoord.y})`;
}

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
  actualizarReglaSalida();
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

// matriz NxN
function Matriz(n) {
  matrizTablero = Array.from({ length: n }, () => Array.from({ length: n }, () => '.'));
}

// crear grid
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
      celda.addEventListener('mouseenter', hoverCelda);
      celda.addEventListener('mouseleave', salirHoverCelda);
      tablero.appendChild(celda);
    }  
  }
  renderizarMarcos(size);
  setEdicion(true);
  setPosicionSalida(null);
  renderizarSimbolos();
}

// Click en celda 
function onClickCelda(e){
  const x = parseInt(e.currentTarget.dataset.x,10);
  const y = parseInt(e.currentTarget.dataset.y,10);

  // ----- MODO ELEGIR OBJETIVO -----
  if (modoElegirObjetivo){
    const carro = obtenerCarrosDesdeCelda(x,y);
    if (!carro){
      mensajeError("Por favor, seleccione una celda que sea parte de un carro.");
      return;
    }
    if (carro.numeroCabezas !== 1){
      mensajeError("Por favor, seleccione la CABEZA de un carro válido (exactamente una cabeza).");
      return;
    }

    const { x: hx, y: hy, char: headChar } = carro.cabeza;

    // Marcar cabeza elegida como B
    matrizTablero[hy][hx] = 'B';
    const celdaCabeza = getCelda(hx, hy);
    if (celdaCabeza) celdaCabeza.textContent = 'B';

    headCharSeleccionado = headChar;

    // Salida en el borde consistente con la orientación de la cabeza elegida
    const salida = calcularSalidaParaCarro(hx, hy, headChar);
    setPosicionSalida(salida);
    actualizarReglaSalida();

    // Salir de modo objetivo
    modoElegirObjetivo = false;
    document.getElementById('tablero').classList.remove('modo-elegir-objetivo');
    quitarHighlight();
    mensajeOk(`Objetivo seleccionado. Salida: (${salida.x}, ${salida.y}). Ahora puedes Iniciar.`);

    // Habilitar Iniciar / deshabilitar Elegir objetivo
    const btnComenzar = document.getElementById('btnComenzar');
    if (btnComenzar) btnComenzar.disabled = false;
    const btnElegirObjetivo = document.getElementById('btnElegirObjetivo');
    if (btnElegirObjetivo) btnElegirObjetivo.disabled = true;
    return;
  }

  // ----- MODO EDICIÓN NORMAL -----
  if (!edicionActiva) return;

  // Escribir símbolo
  matrizTablero[y][x] = rellenoActual;
  e.currentTarget.textContent = (rellenoActual === '.') ? '' : rellenoActual;

  // Si el usuario edita el tablero, la salida previa ya no es válida
  setPosicionSalida(null);
  const btnElegirObjetivo = document.getElementById('btnElegirObjetivo');
  if (btnElegirObjetivo) btnElegirObjetivo.disabled = true;
  const btnComenzar = document.getElementById('btnComenzar');
  if (btnComenzar) btnComenzar.disabled = true;
}

// función para calcular la salida según la cabeza ===
function calcularSalidaParaCarro(hx, hy, headChar){
  const n = sizeTablero;
  if (headChar === '>') return { x: n-1, y: hy }; // derecha
  if (headChar === '<') return { x: 0,   y: hy }; // izquierda
  if (headChar === 'v') return { x: hx,  y: n-1 }; // abajo
  if (headChar === '^') return { x: hx,  y: 0   }; // arriba
  return { x: n-1, y: hy }; // fallback horizontal
}

// Mensajes
function mensajeOk(txt){
  document.getElementById('mensajes').innerHTML = `<p class="ok">${txt}</p>`;
}
function mensajeError(txt){
  document.getElementById('mensajes').innerHTML = `<p class="error">${txt}</p>`;
}

// Escaneo de carros (validaciones)
function EscanearCarros(){
  const largo = matrizTablero.length;
  const carrosIncompletos = [];
  const errores = [];

  // --- HORIZONTALES ---
  for (let y = 0; y < matrizTablero.length; y++){
    let x = 0;
    while (x < matrizTablero.length){

      if (matrizTablero[y][x] === '-') {
        let x0 = x;
        while (x + 1 < matrizTablero.length && matrizTablero[y][x + 1] === '-') x++;
        let x1 = x;

        const headLeft  = (x0 - 1 >= 0 && matrizTablero[y][x0 - 1] === '<');
        const headRight = (x1 + 1 <  matrizTablero.length && matrizTablero[y][x1 + 1] === '>');

        if (!headLeft && !headRight){
          carrosIncompletos.push(`Carro horizontal incompleto en fila ${y}, columnas ${x0} a ${x1}`);
        } else if (headLeft && headRight){
          errores.push(`Error: Carro horizontal con dos cabezas en fila ${y}, columnas ${x0-1} a ${x1+1}`);
        }
      }

      // cabezas sueltas
      if (matrizTablero[y][x] === '<' && (x + 1 >= matrizTablero.length || matrizTablero[y][x + 1] !== '-')){
        carrosIncompletos.push(`Cabeza '<' sin cuerpo en fila ${y}, columna ${x}`);
      }
      if (matrizTablero[y][x] === '>' && (x - 1 < 0 || matrizTablero[y][x - 1] !== '-')){
        carrosIncompletos.push(`Cabeza '>' sin cuerpo en fila ${y}, columna ${x}`);
      }

      x++;
    }

    // 2) Detectar cabezas sueltas sin cuerpo pegado
    if (matrizTablero[y][x] === '<' && (x + 1 >= matrizTablero.length || matrizTablero[y][x + 1] !== '-')){
      carrosIncompletos.push(`Cabeza '<' sin cuerpo en fila ${y}, columna ${x}`);
    }
    if (matrizTablero[y][x] === '>' && (x - 1 < 0 || matrizTablero[y][x - 1] !== '-')){
      carrosIncompletos.push(`Cabeza '>' sin cuerpo en fila ${y}, columna ${x}`);
    }

    x++;
  }
}

  // --- VERTICALES ---
  for (let x=0; x<largo; x++){
    let y=0;
    while(y<largo){
      if (matrizTablero[y][x] === '|'){
        let y0 = y;
        while (y+1 < largo && matrizTablero[y+1][x]==='|') y++;
        let y1 = y;

        const tieneArriba = (y0 > 0 && matrizTablero[y0-1][x] === '^');
        const tieneAbajo  = (y1 < largo-1 && matrizTablero[y1+1][x] === 'v');

        if (!tieneArriba && !tieneAbajo){
          carrosIncompletos.push(`Carro vertical incompleto en columna ${x}, filas ${y0} a ${y1}`);
        } else if (tieneArriba && tieneAbajo){
          errores.push(`Error: Carro vertical con dos cabezas en columna ${x}, filas ${y0-1} a ${y1+1}`);
        }
      }
      y++;
    }
  }

  return { carrosIncompletos, errores };
}

// highlight helpers
function quitarHighlight(){
  highlightActual.forEach(el => el.classList.remove('car-highlight'));
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
function hoverCelda(e){
  if(!modoElegirObjetivo) return;
  const x = parseInt(e.currentTarget.dataset.x,10);
  const y = parseInt(e.currentTarget.dataset.y,10);
  const carro = obtenerCarrosDesdeCelda(x,y);
  if (carro && carro.numeroCabezas === 1) resaltarCarro(carro.celdas);
  else quitarHighlight();
}
function salirHoverCelda(){ if(modoElegirObjetivo) quitarHighlight(); }

// localizar un carro desde una celda
function obtenerCarrosDesdeCelda(x,y){
  const matriz = matrizTablero[y][x];
  const tamano = sizeTablero;

  // cabezas horizontales
  if (matriz === '>' || matriz === '<'){
    const direccion = (matriz === '>') ? -1 : +1; // cuerpo hacia el lado contrario
    const celdas = [[x,y]];
    let nx = x + direccion;
    while (nx >=0 && nx < tamano && matrizTablero[y][nx] === '-'){
      celdas.push([nx,y]);
      nx += direccion;
    }
    return { orientacion: 'H', cabeza: {x,y, char: matriz}, numeroCabezas:1, celdas };
  }

  // cabezas verticales
  if (matriz === 'v' || matriz === '^'){
    const direccion = (matriz === 'v') ? -1 : +1; // cuerpo hacia el lado contrario
    const celdas = [[x,y]];
    let ny = y + direccion;
    while (ny >=0 && ny < tamano && matrizTablero[ny][x] === '|'){
      celdas.push([x,ny]);
      ny += direccion;
    }
    return { orientacion: 'V', cabeza: {x,y, char: matriz}, numeroCabezas:1, celdas };
  }

  // cuerpo horizontal
  if (matriz === '-'){
    let x0 = x, x1 = x;
    while (x0 - 1 >= 0 && matrizTablero[y][x0 - 1] === '-') x0--;
    while (x1 + 1 < tamano && matrizTablero[y][x1 + 1] === '-') x1++;

    const cabezaIzq = (x0 - 1 >= 0 && matrizTablero[y][x0 - 1] === '<') ? {x: x0 - 1, y, char:'<'} : null;
    const cabezaDer = (x1 + 1 < tamano && matrizTablero[y][x1 + 1] === '>') ? {x: x1 + 1, y, char:'>'} : null;
    const celdas = []; 
    for(let xx = x0; xx <= x1; xx++) celdas.push([xx,y]);
    if (cabezaIzq) celdas.push([cabezaIzq.x, cabezaIzq.y]);
    if (cabezaDer) celdas.push([cabezaDer.x, cabezaDer.y]);
    const numeroCabezas = (cabezaIzq ? 1 : 0) + (cabezaDer ? 1 : 0);
    return { orientacion: 'H', cabeza: cabezaIzq || cabezaDer, numeroCabezas, celdas };
  }

  // cuerpo vertical
  if (matriz === '|'){
    let y0 = y, y1 = y;
    while (y0 - 1 >= 0 && matrizTablero[y0 - 1][x] === '|') y0--;
    while (y1 + 1 < tamano && matrizTablero[y1 + 1][x] === '|') y1++;

    const cabezaArr = (y0 - 1 >= 0 && matrizTablero[y0 - 1][x] === '^') ? {x, y: y0 - 1, char:'^'} : null;
    const cabezaAba = (y1 + 1 < tamano && matrizTablero[y1 + 1][x] === 'v') ? {x, y: y1 + 1, char:'v'} : null;
    const celdas = [];
    for(let yy = y0; yy <= y1; yy++) celdas.push([x,yy]);
    if (cabezaArr) celdas.push([cabezaArr.x, cabezaArr.y]);
    if (cabezaAba) celdas.push([cabezaAba.x, cabezaAba.y]);
    const numeroCabezas = (cabezaArr ? 1 : 0) + (cabezaAba ? 1 : 0);
    return { orientacion: 'V', cabeza: cabezaArr || cabezaAba, numeroCabezas, celdas };
  }

  return null;
}

function normalizarChar(ch){
  if (ch === 'I') return '|';
  if (ch === '—' || ch === '–' || ch === '−') return '-';
  if (ch === '\u00A0') return ' ';
  return ch;
}

function confirmarTablero(){
  // sincroniza DOM->matriz # document object model 
  document.querySelectorAll('.celda').forEach(celda => {
    const x = parseInt(celda.dataset.x,10);
    const y = parseInt(celda.dataset.y,10);
    const ch = (celda.textContent || '').trim();
    const norm = normalizarChar(ch);
    matrizTablero[y][x] = (norm && VALIDOS.has(norm)) ? norm: '.';  // --------------------- AQUI ESTABA EL PROBLEMA !!! --------------------------------------------
  });

  // repinta valores normalizados
  document.querySelectorAll('.celda').forEach(celda => {
    const x = parseInt(celda.dataset.x,10);
    const y = parseInt(celda.dataset.y,10);
    const v = matrizTablero[y][x];
    celda.textContent = (v === '.') ? '' : v;
  });

  const { carrosIncompletos, errores } = EscanearCarros();
  if (errores.length || carrosIncompletos.length){
    const msg = [];
    if (carrosIncompletos.length) msg.push(`Carros incompletos:\n- ${carrosIncompletos.join('\n- ')}`);
    if (errores.length) msg.push(`Errores encontrados:\n- ${errores.join('\n- ')}`);
    mensajeError(msg.join('<br>'));

    const btnComenzar = document.getElementById('btnComenzar'); 
    const btnElegirObjetivo = document.getElementById('btnElegirObjetivo');
    if (btnComenzar) btnComenzar.disabled = true;
    if (btnElegirObjetivo) btnElegirObjetivo.disabled = true;
    return;
  }

  limpiarObjetivoCabeza();
  setEdicion(false);
  mensajeOk("Tablero confirmado. Listo para elegir objetivo.");
  const btnElegirObjetivo = document.getElementById('btnElegirObjetivo');
  if (btnElegirObjetivo) btnElegirObjetivo.disabled = false;
  const btnComenzar = document.getElementById('btnComenzar');
  if (btnComenzar) btnComenzar.disabled = true;
  actualizarReglaSalida();
}

function limpiarObjetivoCabeza(){
  document.querySelectorAll('.cabeza-objetivo')
    .forEach(elem => elem.classList.remove('cabeza-objetivo'));
}

// activar modo para elegir objetivo
function activarModoElegirObjetivo(){
  modoElegirObjetivo = true;
  document.getElementById('tablero').classList.add('modo-elegir-objetivo');
  mensajeOk("Modo elegir objetivo activo. Haga clic en la cabeza del carro objetivo.");
}

// ---------------------------
//
// Modelo y búsqueda (backtracking / A*)
// ---------------------------

function clonMatriz(m){ return m.map(r=>r.slice()); }
function findB(m){
  for(let y=0;y<m.length;y++) for(let x=0;x<m.length;x++)
    if(m[y][x]==='B') return {x,y};
  return null;
}
// Detecta hacia dónde ve B inspeccionando su cuerpo
function inferirOrientacionB(m, bx, by){
  if (bx > 0 && m[by][bx - 1] === '-') return '>';
  if (bx < m.length - 1 && m[by][bx + 1] === '-') return '<';
  for (let x = bx - 1; x >= 0; x--) if (m[by][x] === '-') return '>';
  for (let x = bx + 1; x < m.length; x++) if (m[by][x] === '-') return '<';
  return '>';
}

// Orientación real de B leyendo su cuerpo (soporta H y V)
function orientacionDeB(m, bx, by){
  if (bx > 0 && m[by][bx - 1] === '-') return '>';
  if (bx < m.length - 1 && m[by][bx + 1] === '-') return '<';
  if (by + 1 < m.length && m[by + 1][bx] === '|') return '^';
  if (by - 1 >= 0      && m[by - 1][bx] === '|') return 'v';
  if (headCharSeleccionado) return headCharSeleccionado;
  return '>';
}

function textoReglaSalida() {
  const b = findB(matrizTablero);
  if (!b) return null;
  const h = orientacionDeB(matrizTablero, b.x, b.y);
  if (h === '>' || h === '<') {
    return `La salida debe estar en la misma fila que B (fila ${b.y}).`;
  } else {
    return `La salida debe estar en la misma columna que B (columna ${b.x}).`;
  }
}

function actualizarReglaSalida() {
  const el = document.getElementById('regla-salida');
  if (!el) return;
  const t = textoReglaSalida();
  if (t) el.textContent = t;
}

function hash(m){ return m.map(r=>r.join('')).join('|'); }

function esMeta(m, salida){
  if (!salida) return false;
  const b = findB(m);
  if (!b) return false;

  // Caso 1: B ya está en la salida
  if (b.x === salida.x && b.y === salida.y) return true;

  // Caso 2: camino despejado verticalmente entre B y la salida
  if (b.x === salida.x){
    const step = salida.y > b.y ? 1 : -1;
    for (let y = b.y + step; y !== salida.y + step; y += step){
      if (m[y][b.x] !== '.') return false;
    }
    return true;
  }

  // Caso 3: camino despejado horizontalmente entre B y la salida
  if (b.y === salida.y){
    const step = salida.x > b.x ? 1 : -1;
    for (let x = b.x + step; x !== salida.x + step; x += step){
      if (m[b.y][x] !== '.') return false;
    }
    return true;
  }

  return false;
}
function generarMovimientos(m){
  const n = m.length;
  const movs = [];
  for(let y=0;y<n;y++){
    for(let x=0;x<n;x++){
      const c = m[y][x];
      if(c==='B' || CABEZAS.has(c)){

        // --- Caso especial B: mover según su orientación real ---
        if (c === 'B'){
          const h = orientacionDeB(m, x, y);
          if (h === '>' || h === '<'){
            const dirSign = (h === '>') ? -1 : +1; // cuerpo al lado contrario
            const len = longitudCoche(m, x, y, 'H', dirSign);
            // derecha
            if(x+1<n && m[y][x+1]==='.')
              movs.push({ carId:`(${x},${y})`, dir:'der', steps:1, apply:(mm)=>{
                for(let i=0;i<len;i++){
                  const px = x - (h==='>'? i : -i);
                  mm[y][px+1] = (i===0 ? 'B' : '-');
                  if(i===len-1) mm[y][px] = '.';
                }
              }});
            // izquierda
            const colaX = (h==='>') ? x-(len-1) : x+(len-1);
            if(colaX-1>=0 && m[y][colaX-1]==='.')
              movs.push({ carId:`(${x},${y})`, dir:'izq', steps:1, apply:(mm)=>{
                for(let i=len-1;i>=0;i--){
                  const px = x - (h==='>'? i : -i);
                  mm[y][px-1] = (i===0 ? 'B' : '-');
                  if(i===len-1) mm[y][px] = '.';
                }
              }});
          } else {
            // vertical
            const dirSign = (h === 'v') ? -1 : +1; // cuerpo al lado contrario
            const len = longitudCoche(m, x, y, 'V', dirSign);
            // abajo
            if(y+1<n && m[y+1][x]==='.')
              movs.push({ carId:`(${x},${y})`, dir:'aba', steps:1, apply:(mm)=>{
                for(let i=0;i<len;i++){
                  const py = y - (h==='v'? i : -i);
                  mm[py+1][x] = (i===0 ? 'B' : '|');
                  if(i===len-1) mm[py][x] = '.';
                }
              }});
            // arriba
              if (y-1 >= 0 && m[y-1][x] === '.')
                movs.push({ carId:`(${x},${y})`, dir:'arr', steps:1, apply:(mm)=>{
                  for (let i=len-1; i>=0; i--){
                    const py = y - (h==='v' ? i : -i);  // tu mismo cálculo
                    mm[py-1][x] = (i===0 ? 'B' : '|');
                    if (i===len-1) mm[py][x] = '.';
                  }
              }});
          }
          continue;
        }

        // --- Resto de cabezas normales ---
        if(c==='>'){
          const len = longitudCoche(m, x, y, 'H', -1);
          if(x+1<n && m[y][x+1]==='.')
            movs.push({ carId:`(${x},${y})`, dir:'der', steps:1, apply:(mm)=>{
              for(let i=0;i<len;i++){
                const px = x - i;
                mm[y][px+1] = (i===0 ? c : '-');
                if(i===len-1) mm[y][px] = '.';
              }
            }});
          const colaX = x - (len-1);
          if(colaX-1>=0 && m[y][colaX-1]==='.')
            movs.push({ carId:`(${x},${y})`, dir:'izq', steps:1, apply:(mm)=>{
              for(let i=len-1;i>=0;i--){
                const px = x - i;
                mm[y][px-1] = (i===0 ? c : '-');
                if(i===len-1) mm[y][px] = '.';
              }
            }});
        } else if(c==='<'){
          const len = longitudCoche(m, x, y, 'H', +1);
          if(x-1>=0 && m[y][x-1]==='.')
            movs.push({ carId:`(${x},${y})`, dir:'izq', steps:1, apply:(mm)=>{
              for(let i=0;i<len;i++){
                const px = x + i;
                mm[y][px-1] = (i===0 ? c : '-');
                if(i===len-1) mm[y][px] = '.';
              }
            }});
          const colaX = x + (len-1);
          if(colaX+1<n && m[y][colaX+1]==='.')
            movs.push({ carId:`(${x},${y})`, dir:'der', steps:1, apply:(mm)=>{
              for(let i=len-1;i>=0;i--){
                const px = x + i;
                mm[y][px+1] = (i===0 ? c : '-');
                if(i===len-1) mm[y][px] = '.';
              }
            }});
        } else if(c==='v'){
          const len = longitudCoche(m, x, y, 'V', -1);
          if(y+1<n && m[y+1][x]==='.')
            movs.push({ carId:`(${x},${y})`, dir:'aba', steps:1, apply:(mm)=>{
              for(let i=0;i<len;i++){
                const py = y - i;
                mm[py+1][x] = (i===0 ? c : '|');
                if(i===len-1) mm[py][x] = '.';
              }
            }});
          const colaY = y - (len-1);
          if(colaY-1>=0 && m[colaY-1][x]==='.')
            movs.push({ carId:`(${x},${y})`, dir:'arr', steps:1, apply:(mm)=>{
              for(let i=len-1;i>=0;i--){
                const py = y - i;
                mm[py-1][x] = (i===0 ? c : '|');
                if(i===len-1) mm[py][x] = '.';
              }
            }});
        } else if(c==='^'){
          const len = longitudCoche(m, x, y, 'V', +1);
          if(y-1>=0 && m[y-1][x]==='.')
            movs.push({ carId:`(${x},${y})`, dir:'arr', steps:1, apply:(mm)=>{
              for(let i=0;i<len;i++){
                const py = y + i;
                mm[py-1][x] = (i===0 ? c : '|');
                if(i===len-1) mm[py][x] = '.';
              }
            }});
          const colaY = y + (len-1);
          if(colaY+1<n && m[colaY+1][x]==='.')
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
  return movs;
}

function longitudCoche(m, hx, hy, tipo, dirSign){
  let len = 1;
  if(tipo==='H'){
    let x = hx + dirSign;
    while(x>=0 && x<m.length && m[hy][x]==='-'){ len++; x += dirSign; }
  } else {
    let y = hy + dirSign;
    while(y>=0 && y<m.length && m[y][hx]==='|'){ len++; y += dirSign; }
  }
  return Math.max(len, 2);
}
// ==== A* support (heurística + PQ + A*) ====

// ==== A* (heurística + PQ + A*) ====

function heuristica(m, salida){
  const b = findB(m);
  if(!b || !salida) return 0;

  const h = orientacionDeB(m, b.x, b.y);

  if (h === '>' || h === '<'){
    if (b.y !== salida.y) return Math.abs(b.x - salida.x) + Math.abs(b.y - salida.y);

    const step = (salida.x >= b.x) ? 1 : -1;
    const dist = Math.abs(salida.x - b.x);
    let bloqueos = 0;
    for (let x = b.x + step; x !== salida.x + step; x += step){
      if (m[b.y][x] !== '.') bloqueos++;
    }
    return dist + bloqueos * 2;
  } else {

    if (b.x !== salida.x) return Math.abs(b.x - salida.x) + Math.abs(b.y - salida.y);

    const step = (salida.y >= b.y) ? 1 : -1;
    const dist = Math.abs(salida.y - b.y);
    let bloqueos = 0;
    for (let y = b.y + step; y !== salida.y + step; y += step){
      if (m[y][b.x] !== '.') bloqueos++;
    }
    return dist + bloqueos * 2;
  }
}

function aplicarMovimiento(m, move){
  const mm = m.map(r => r.slice());
  move.apply(mm);
  return mm;
}

class PQ {
  constructor(){ this.a = []; }
  push(x){ this.a.push(x); this._up(this.a.length - 1); }
  pop(){
    const a = this.a;
    if (a.length === 0) return undefined;
    const top = a[0];
    const last = a.pop();
    if (a.length){ a[0] = last; this._down(0); }
    return top;
  }
  isEmpty(){ return this.a.length === 0; }
  
  _up(i){
    const a = this.a;
    while (i > 0){
      const p = (i - 1) >> 1; // indice del padre
      if (a[p].f <= a[i].f) break; // si el padre es mejor igual que el hijo se queda igual 
      [a[p], a[i]] = [a[i], a[p]]; // sino se intercambian 
      i = p; // se termina cuando el padre es menor o igual a la raiz 
    }
  }
  _down(i){
    const a = this.a;
    for(;;){
      let l = i*2 + 1, r = l + 1, m = i;
      if (l < a.length && a[l].f < a[m].f) m = l;
      if (r < a.length && a[r].f < a[m].f) m = r;
      if (m === i) break;
      [a[i], a[m]] = [a[m], a[i]];
      i = m;
    }
  }
}

function resolverAStar(m0, salida, limite = 200000){
  const startKey = hash(m0);
  const g = new Map([[startKey, 0]]);
  const came = new Map(); // key -> {prev, move}
  const open = new PQ();
  open.push({ f: heuristica(m0, salida), key: startKey, m: m0 });

  const visit = new Set(); // closed
  let explorados = 0;

  while(!open.isEmpty()){
    const cur = open.pop();
    if (visit.has(cur.key)) continue;
    visit.add(cur.key);
    explorados++;

    if (esMeta(cur.m, salida)){
      const camino = [];
      let k = cur.key;
      while(came.has(k)){
        const { prev, move } = came.get(k);
        camino.push(move);
        k = prev;
      }
      camino.reverse();
      return { moves: camino, explored: explorados };
    }
    if (visit.size > limite) break;

    const movs = generarMovimientos(cur.m);
    for (const mv of movs){
      const m2 = aplicarMovimiento(cur.m, mv);
      const nk = hash(m2);
      const tentative = (g.get(cur.key) ?? Infinity) + 1;
      if (tentative < (g.get(nk) ?? Infinity)){
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
// Backtracking (DFS) compatible con la UI
// ---------------------------
function resolverBacktracking(m0, salida, limite = 200000){ // m0 matriz inicial del tablero, salidaCoord, limite para que no se quede en buqle 
  const startKey = hash(m0); // guardamos el estado inicial para buscar a partir de ese 
  const visit = new Set([startKey]); // aqui guardamos el conjunto de vistiados para no volver a repetir el mismo movimiento inf
  const path = []; // empezamos con el camino vacio 
  let explorados = 0; // para saber cuantos estados exploramos y no pasarnos del limite 
  let found = false; 

  function dfs(m){
    if (esMeta(m, salida)) { found = true; return true; } // caso base que si ya puede salir o esta en la salida se termina
    if (explorados++ > limite) return false; // o si ya pasamos el limite se termina para que no se quede en bucle

    const movs = generarMovimientos(m); // empezamos a generar movimiendos de la matriz original en una copia para no afectar la original
    for (const mv of movs){ // para cada movimiento 
      const m2 = aplicarMovimiento(m, mv); // aplicamos el movimiento al clon y creamos el siguiente estado 
      const k = hash(m2);  // calculamos el ciclo para que no se repita el mismo 
      if (visit.has(k)) continue; // si ya visitamos un estado, ignorelo 
      visit.add(k); // para cada estado vistiado lo agregamos al conjunto de estados visitados antes de visitarlo 
      path.push(mv); // ahora si lo visitamos y lo guardamos en el camino (guardamos en la pila camino)
      if (dfs(m2)) return true; // si se genero true es porque se encontro la solucion 
      path.pop(); // y si no dio true, hacemos pop al path actual para que vuelva a iniciar por otro camino 
    }
    return false; // si ya recorrimos todo y no llegamos a la solucion es falsa
  }

  dfs(m0); // iniciamos desde el estado actual 
  return { moves: found ? path.slice() : null, explored: explorados }; // retornamos el camino retornamos el path con el camino correcto y los estados explorados.
}

// ---------------------------
// UI: iniciar, animar, métricass
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
  if (moves === null) { 
    cont.innerHTML = `<p>No se encontró solución.</p>`; 
    return; 
  }
  if (!moves.length) {
    cont.innerHTML = `<p>El carro objetivo ya puede salir (0 movimientos).</p>`;
    return;
  }
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
  if (matrizTablero.length < 2 || matrizTablero.length > 12) {
    mensajeError('El tablero debe ser entre 2x2 y 12x12.');
    return false;
  }

  let bCount = 0;
  for (let y = 0; y < matrizTablero.length; y++){
    for (let x = 0; x < matrizTablero.length; x++){
      const v = matrizTablero[y][x];
      if (!'.-|><vB^'.includes(v)){
        mensajeError(`Símbolo inválido "${v}" en (${x},${y}).`);
        return false;
      }
      if (v === 'B') bCount++;
    }
  }
  if (bCount !== 1){
    mensajeError('Debe existir exactamente un carro objetivo (B).');
    return false;
  }

  if (!salidaCoord){
    mensajeError('Falta la salida.');
    return false;
  }

  // Solo límites del tablero
  if (salidaCoord.x < 0 || salidaCoord.y < 0 ||
      salidaCoord.x >= matrizTablero.length || salidaCoord.y >= matrizTablero.length){
    mensajeError('Salida inválida.');
    return false;
  }

  // Regla de misma fila/columna según orientación de B
  const bPos = findB(matrizTablero);
  if (!bPos) { mensajeError('Debe existir exactamente un carro objetivo (B).'); return false; }
  const head = orientacionDeB(matrizTablero, bPos.x, bPos.y);
  if (head === '>' || head === '<') {
    if (salidaCoord.y !== bPos.y) {
      mensajeError(`La salida debe estar en la misma fila que B (fila ${bPos.y}).`);
      return false;
    }
  } else {
    if (salidaCoord.x !== bPos.x) {
      mensajeError(`La salida debe estar en la misma columna que B (columna ${bPos.x}).`);
      return false;
    }
  }

  return true;
}


async function comenzar(){
  if (!recomputarSalidaDesdeB()) return;
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

if (resultado.moves !== null) {        // [] ó [ ... ] => hay solución
  if (resultado.moves.length) {
    await animarSolucion(matrizTablero, resultado.moves);
  }
  mensajeOk('¡Listo!');
} else {
  mensajeError('No hay solución.');
}


  setEdicion(true);
}

// ---------------------------
// Inicialización
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

  // Inicializa matriz antes de crear tablero
  Matriz(sizeTablero);
  crearTablero(sizeTablero);

  const btnComenzar = document.getElementById('btnComenzar');
  if (btnComenzar) btnComenzar.addEventListener('click', comenzar);

  const btnElegirObjetivo = document.getElementById('btnElegirObjetivo');
  if (btnElegirObjetivo) btnElegirObjetivo.addEventListener('click', activarModoElegirObjetivo);

  const btnEditar = document.getElementById('btnEditar');
  if (btnEditar) btnEditar.addEventListener('click', ()=> setEdicion(true));

  const btnConfirmar = document.getElementById('btnConfirmar');
  if (btnConfirmar) btnConfirmar.addEventListener('click', confirmarTablero);

  const btnReiniciar = document.getElementById('btnReiniciar');
  if (btnReiniciar) btnReiniciar.addEventListener('click', ()=>{
    Matriz(sizeTablero);
    crearTablero(sizeTablero);
    setPosicionSalida(null);
    headCharSeleccionado = null;
    document.getElementById('metricas').innerHTML='';
    document.getElementById('acciones').innerHTML='';
    document.getElementById('mensajes').innerHTML='';
    const bEO = document.getElementById('btnElegirObjetivo');
    if (bEO) bEO.disabled = true;
    const bC = document.getElementById('btnComenzar');
    if (bC) bC.disabled = true;
  });
});
