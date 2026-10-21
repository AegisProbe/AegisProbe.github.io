import { supabase, mensajeConfiguracion } from "./supabase-client.js";

const $ = (id) => document.getElementById(id);
const ui = {
  invitado: $("cuenta-invitado"), invitadoTexto: $("cuenta-invitado-texto"),
  paneles: $("cuenta-paneles"), saludo: $("cuenta-saludo"),
  nombre: $("cuenta-nombre"), correo: $("cuenta-correo"), iniciales: $("cuenta-iniciales"),
  verificacion: $("cuenta-verificacion"), estado: $("cuenta-estado"),
  total: $("cuenta-total"), pendientes: $("cuenta-pendientes"), finalizadas: $("cuenta-finalizadas"),
  tabla: $("cuenta-solicitudes"), tablaCaja: $("cuenta-tabla-contenedor"),
  vacio: $("cuenta-vacio"), vacioTitulo: $("cuenta-vacio-titulo"),
  vacioTexto: $("cuenta-vacio-texto"), vacioAccion: $("cuenta-vacio-accion"),
  filtro: $("cuenta-filtro"), actualizar: $("cuenta-actualizar")
};

const servicioTexto = {
  "pentesting-web": "Pentesting web",
  "pentesting-movil": "Pentesting móvil",
  infraestructura: "Infraestructura y red",
  "red-team": "Red Team",
  auditoria: "Auditoría de seguridad",
  "ingenieria-social": "Ingeniería social"
};
const estadoTexto = {
  pendiente: "Pendiente", en_revision: "En revisión", contactado: "Contactado", cerrado: "Cerrado"
};
const urgenciaTexto = { normal: "Normal", alta: "Alta", critica: "Crítica" };
let solicitudes = [];
let usuarioActual = null;

function textoSeguro(id, valor) { const nodo = $(id); if (nodo) nodo.textContent = valor; }
function estadoDeCarga(texto, clase = "") {
  ui.estado.textContent = texto;
  ui.estado.className = "cuenta-estado" + (clase ? " " + clase : "");
}
function mostrarInvitado(texto) {
  ui.invitado.hidden = false;
  ui.paneles.hidden = true;
  ui.invitadoTexto.textContent = texto;
  ui.saludo.textContent = "Accede a tu cuenta de AegisProbe para consultar tus solicitudes y gestionar tu seguimiento.";
}
function obtenerIniciales(valor) {
  return (valor || "AP").trim().split(/\s+/).slice(0, 2).map(parte => parte[0] || "").join("").toUpperCase();
}
function crearCelda(valor, etiqueta) {
  const celda = document.createElement("td");
  celda.dataset.label = etiqueta;
  celda.textContent = valor;
  return celda;
}
function dibujarSolicitudes() {
  const filtro = ui.filtro.value;
  const registros = filtro === "todos" ? solicitudes : solicitudes.filter(s => s.estado === filtro);
  ui.tabla.replaceChildren();
  const sinRegistros = registros.length === 0;
  ui.vacio.hidden = !sinRegistros;
  ui.tablaCaja.hidden = sinRegistros;
  if (sinRegistros) {
    const filtrado = solicitudes.length > 0;
    ui.vacioTitulo.textContent = filtrado ? "Sin resultados para este estado" : "Aún no tienes solicitudes";
    ui.vacioTexto.textContent = filtrado
      ? "No hay solicitudes que coincidan con el filtro seleccionado. Puedes probar con otro estado."
      : "Cuando solicites una auditoría, aparecerá aquí para que puedas seguir su estado.";
    ui.vacioAccion.hidden = filtrado;
  }
  registros.forEach(solicitud => {
    const fila = document.createElement("tr");
    const fecha = solicitud.creado_en
      ? new Date(solicitud.creado_en).toLocaleDateString("es-PE", {year:"numeric", month:"short", day:"numeric"})
      : "—";
    fila.appendChild(crearCelda(fecha, "Fecha"));
    fila.appendChild(crearCelda(servicioTexto[solicitud.servicio] || solicitud.servicio || "—", "Servicio"));
    const urgencia = crearCelda("", "Urgencia");
    const marcaUrgencia = document.createElement("span");
    marcaUrgencia.className = "cuenta-etiqueta-urgencia cuenta-urgencia-" + (['normal','alta','critica'].includes(solicitud.urgencia) ? solicitud.urgencia : 'normal');
    marcaUrgencia.textContent = urgenciaTexto[solicitud.urgencia] || solicitud.urgencia || "—";
    urgencia.appendChild(marcaUrgencia);
    fila.appendChild(urgencia);
    const estado = crearCelda("", "Estado");
    const etiqueta = document.createElement("span");
    const claseEstado = Object.hasOwn(estadoTexto, solicitud.estado) ? solicitud.estado : "desconocido";
    etiqueta.className = "cuenta-etiqueta-estado cuenta-estado-" + claseEstado;
    etiqueta.textContent = estadoTexto[solicitud.estado] || "Sin estado";
    estado.appendChild(etiqueta);
    fila.appendChild(estado);
    ui.tabla.appendChild(fila);
  });
  estadoDeCarga(solicitudes.length
    ? `Mostrando ${registros.length} de ${solicitudes.length} solicitudes.`
    : "Tu historial todavía está vacío.", "cuenta-estado-listo");
}
async function cargarSolicitudes() {
  if (!usuarioActual) return;
  ui.actualizar.disabled = true;
  ui.filtro.disabled = true;
  estadoDeCarga("Actualizando solicitudes…");
  try {
    const { data, error } = await supabase.from("solicitudes_auditoria")
      .select("creado_en, servicio, urgencia, estado")
      .eq("usuario_id", usuarioActual.id)
      .order("creado_en", { ascending: false });
    if (error) throw error;
    solicitudes = data || [];
    textoSeguro("cuenta-total", String(solicitudes.length));
    textoSeguro("cuenta-pendientes", String(solicitudes.filter(s => s.estado === "pendiente" || s.estado === "en_revision").length));
    textoSeguro("cuenta-finalizadas", String(solicitudes.filter(s => s.estado === "cerrado").length));
    dibujarSolicitudes();
  } catch (error) {
    console.error("No se pudo consultar las solicitudes:", error);
    ui.vacio.hidden = true;
    ui.tablaCaja.hidden = true;
    estadoDeCarga("No se pudieron recuperar tus solicitudes. Comprueba la conexión y vuelve a intentarlo.", "cuenta-estado-error");
    textoSeguro("cuenta-total", "—"); textoSeguro("cuenta-pendientes", "—"); textoSeguro("cuenta-finalizadas", "—");
  } finally {
    ui.actualizar.disabled = false;
    ui.filtro.disabled = false;
  }
}

async function cargar() {
  if (!supabase) { mostrarInvitado(mensajeConfiguracion); return; }
  try {
    const { data: {user}, error } = await supabase.auth.getUser();
    if (error || !user) { mostrarInvitado("Inicia sesión con tu correo confirmado para acceder a tus solicitudes."); return; }
    usuarioActual = user;
    ui.invitado.hidden = true;
    ui.paneles.hidden = false;
    ui.correo.textContent = user.email || "Correo no disponible";
    const { data: perfil, error: errorPerfil } = await supabase.from("perfiles")
      .select("nombre").eq("id", user.id).maybeSingle();
    if (errorPerfil) console.warn("No se pudo leer el perfil:", errorPerfil.message);
    const nombre = perfil?.nombre || user.user_metadata?.nombre || (user.email || "Usuario").split("@")[0];
    ui.nombre.textContent = nombre;
    ui.iniciales.textContent = obtenerIniciales(nombre);
    ui.saludo.textContent = `Hola, ${nombre.split(/\s+/)[0]}. Revisa tus solicitudes y los próximos pasos de tu seguridad digital.`;
    if (user.email_confirmed_at || user.confirmed_at) {
      ui.verificacion.textContent = "✓ Correo verificado";
      ui.verificacion.className = "cuenta-estado-cuenta is-verificado";
    } else {
      ui.verificacion.textContent = "Correo pendiente de verificación";
      ui.verificacion.className = "cuenta-estado-cuenta is-pendiente";
    }
    await cargarSolicitudes();
  } catch (error) {
    console.error("No se pudo cargar el panel de usuario:", error);
    mostrarInvitado("No pudimos comprobar tu sesión. Revisa la conexión o vuelve a iniciar sesión.");
  }
}
ui.filtro.addEventListener("change", dibujarSolicitudes);
ui.actualizar.addEventListener("click", cargarSolicitudes);
cargar();
