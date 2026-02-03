<!-- src/lib/components/pedidos/ModalValidarPago.svelte -->
<!-- ✅ VERSIÓN MEJORADA - Acordeón con validación obligatoria -->
<script>
  import { createEventDispatcher } from 'svelte';
  import { CheckCircle, XCircle, Loader2, ChevronDown, ChevronUp, Image, MapPin, AlertCircle, Eye } from 'lucide-svelte';
  import { procesarRespuestaWhatsApp } from '$lib/utils/whatsapp';
  
  export let pedido;
  
  const dispatch = createEventDispatcher();
  let loading = false;
  let motivoRechazo = '';
  
  // ✅ Control de acordeones
  let comprobanteAbierto = false;
  let direccionAbierta = false;
  
  // ✅ Control de revisión obligatoria
  let comprobanteRevisado = false;
  let direccionRevisada = false;
  
  // ✅ Validación de dirección
  function validarDireccionCompleta(direccion) {
    if (!direccion || typeof direccion !== 'object') return false;
    
    const camposObligatorios = [
      'nombre_destinatario',
      'telefono',
      'calle',
      'numero_exterior',
      'colonia',
      'codigo_postal',
      'ciudad',
      'estado',
      'referencias'
    ];
    
    return camposObligatorios.every(campo => {
      const valor = direccion[campo];
      return valor && String(valor).trim() !== '';
    });
  }
  
  $: direccionCompleta = validarDireccionCompleta(pedido.cliente_direccion);
  $: requiereEnvio = pedido.envio === true;
  
  // ✅ Marcar como revisado al abrir acordeón
  function toggleComprobante() {
    comprobanteAbierto = !comprobanteAbierto;
    if (comprobanteAbierto && !comprobanteRevisado) {
      setTimeout(() => {
        comprobanteRevisado = true;
      }, 2000); // Debe estar abierto al menos 2 segundos
    }
  }
  
  function toggleDireccion() {
    direccionAbierta = !direccionAbierta;
    if (direccionAbierta && !direccionRevisada) {
      setTimeout(() => {
        direccionRevisada = true;
      }, 2000);
    }
  }
  
  // ✅ Permitir aprobar solo si se revisaron ambas secciones
  $: puedeAprobar = comprobanteRevisado && (requiereEnvio ? direccionRevisada : true);
  
  async function validar(aprobado) {
    // Validaciones previas
    if (aprobado && !puedeAprobar) {
      alert('⚠️ Debes revisar todas las secciones antes de aprobar');
      return;
    }
    
    if (aprobado && requiereEnvio && !direccionCompleta) {
      alert('⚠️ La dirección de envío está incompleta. Debes rechazar el pedido para que el cliente la corrija.');
      return;
    }
    
    if (!aprobado && motivoRechazo.trim().length < 10) {
      alert('⚠️ Debes proporcionar un motivo de rechazo de al menos 10 caracteres');
      return;
    }
    
    loading = true;
    try {
      const res = await fetch(`/api/pedidos/${pedido.id}/validar-pago`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          aprobado,
          motivo_rechazo: aprobado ? null : motivoRechazo,
          validado_por: 'Vendedor'
        })
      });
      
      const result = await res.json();
      if (!result.success) throw new Error(result.error);
      
      alert(result.message);
      procesarRespuestaWhatsApp(result);
      dispatch('validated', result.data);
      
      if (result.whatsapp?.url && result.whatsapp?.auto_abrir) {
        window.open(result.whatsapp.url, '_blank');
      }
      
      dispatch('close');
      
    } catch (error) {
      alert(error.message);
    } finally {
      loading = false;
    }
  }
</script>

<!-- Modal Backdrop -->
<div class="fixed inset-0 z-50 overflow-y-auto">
  <div class="flex items-center justify-center min-h-screen px-4 py-4">
    <div 
      class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
      on:click={() => dispatch('close')}
    ></div>

    <div class="relative bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[95vh] overflow-hidden flex flex-col">
      
      <!-- ✅ HEADER MEJORADO -->
      <div class="px-6 py-5 border-b-2 border-indigo-200 bg-gradient-to-r from-indigo-50 to-blue-50 sticky top-0 z-10">
        <div class="flex items-center gap-4">
          <div class="w-14 h-14 bg-indigo-600 rounded-full flex items-center justify-center shadow-lg">
            <Eye class="w-7 h-7 text-white" />
          </div>
          <div class="flex-1">
            <h3 class="text-2xl font-bold text-gray-900">Validar Pedido</h3>
            <p class="text-sm text-gray-600 mt-1">
              Pedido #{pedido.numero_pedido} • Cliente: {pedido.cliente_nombre}
            </p>
          </div>
        </div>
      </div>

      <!-- ✅ CONTENIDO CON SCROLL -->
      <div class="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        
        <!-- ✅ ALERTA IMPORTANTE -->
        <div class="bg-amber-50 border-2 border-amber-400 rounded-xl p-4 shadow-md">
          <div class="flex items-start gap-3">
            <AlertCircle class="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5 animate-pulse" />
            <div class="flex-1">
              <p class="font-bold text-amber-900 text-lg mb-2">⚠️ Instrucciones Importantes</p>
              <ul class="text-sm text-amber-800 space-y-1.5">
                <li class="flex items-start gap-2">
                  <span class="text-lg flex-shrink-0">1️⃣</span>
                  <span><strong>Revisa AMBAS secciones</strong> (comprobante y dirección) antes de aprobar</span>
                </li>
                <li class="flex items-start gap-2">
                  <span class="text-lg flex-shrink-0">2️⃣</span>
                  <span>Los botones se habilitarán cuando hayas revisado todo</span>
                </li>
                <li class="flex items-start gap-2">
                  <span class="text-lg flex-shrink-0">3️⃣</span>
                  <span>Si algo está mal, <strong>rechaza y explica el motivo</strong></span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <!-- ✅ ACORDEÓN 1: COMPROBANTE DE PAGO -->
        <div class="border-2 rounded-xl overflow-hidden transition-all {comprobanteAbierto ? 'border-indigo-400 shadow-lg' : 'border-gray-300'}">
          <button
            type="button"
            on:click={toggleComprobante}
            class="w-full px-5 py-4 bg-gradient-to-r from-indigo-50 to-blue-50 hover:from-indigo-100 hover:to-blue-100 transition-all flex items-center justify-between"
          >
            <div class="flex items-center gap-4">
              <div class="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center shadow-md">
                <Image class="w-6 h-6 text-white" />
              </div>
              <div class="text-left">
                <h4 class="text-lg font-bold text-gray-900 flex items-center gap-2">
                  1. Comprobante de Pago
                  {#if comprobanteRevisado}
                    <span class="text-green-600 text-xl">✓</span>
                  {/if}
                </h4>
                <p class="text-sm text-gray-600">
                  {comprobanteRevisado ? '✅ Revisado' : '⏳ Pendiente de revisión'}
                </p>
              </div>
            </div>
            <div class="flex items-center gap-3">
              {#if comprobanteRevisado}
                <span class="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-bold">
                  ✓ OK
                </span>
              {:else}
                <span class="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-bold animate-pulse">
                  ⏳ Revisar
                </span>
              {/if}
              {#if comprobanteAbierto}
                <ChevronUp class="w-6 h-6 text-indigo-600" />
              {:else}
                <ChevronDown class="w-6 h-6 text-gray-400" />
              {/if}
            </div>
          </button>
          
          {#if comprobanteAbierto}
            <div class="p-5 bg-white border-t-2 border-indigo-100 animate-slide-down">
              {#if pedido.constancia_pago_url}
                <div class="space-y-4">
                  <div class="bg-gray-50 rounded-xl p-4 border-2 border-gray-200">
                    <img 
                      src={pedido.constancia_pago_url} 
                      alt="Comprobante"
                      class="max-w-full h-auto rounded-lg shadow-md border border-gray-300"
                    />
                  </div>
                  
                  <div class="flex gap-3">
                    <a 
                      href={pedido.constancia_pago_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      class="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium text-center transition-all flex items-center justify-center gap-2"
                    >
                      <Eye class="w-5 h-5" />
                      Ver en Tamaño Real
                    </a>
                  </div>
                  
                  <div class="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg">
                    <p class="text-sm text-blue-900 font-medium">
                      💡 <strong>Verifica:</strong> Que el comprobante sea legible, coincida con el monto del pedido (${pedido.total?.toFixed(2)}), y tenga fecha reciente.
                    </p>
                  </div>
                </div>
              {:else}
                <div class="bg-red-50 border-2 border-red-300 rounded-lg p-6 text-center">
                  <AlertCircle class="w-12 h-12 text-red-500 mx-auto mb-3" />
                  <p class="text-red-800 font-bold text-lg">⚠️ No hay comprobante subido</p>
                  <p class="text-red-600 text-sm mt-2">El cliente aún no ha enviado el comprobante de pago</p>
                </div>
              {/if}
            </div>
          {/if}
        </div>

        <!-- ✅ ACORDEÓN 2: DIRECCIÓN DE ENVÍO -->
        {#if requiereEnvio}
          <div class="border-2 rounded-xl overflow-hidden transition-all {direccionAbierta ? 'border-green-400 shadow-lg' : 'border-gray-300'}">
            <button
              type="button"
              on:click={toggleDireccion}
              class="w-full px-5 py-4 bg-gradient-to-r from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 transition-all flex items-center justify-between"
            >
              <div class="flex items-center gap-4">
                <div class="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center shadow-md">
                  <MapPin class="w-6 h-6 text-white" />
                </div>
                <div class="text-left">
                  <h4 class="text-lg font-bold text-gray-900 flex items-center gap-2">
                    2. Dirección de Envío
                    {#if direccionRevisada}
                      <span class="text-green-600 text-xl">✓</span>
                    {/if}
                  </h4>
                  <p class="text-sm text-gray-600">
                    {direccionRevisada ? '✅ Revisada' : '⏳ Pendiente de revisión'}
                  </p>
                </div>
              </div>
              <div class="flex items-center gap-3">
                {#if !direccionCompleta}
                  <span class="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-bold">
                    ⚠️ Incompleta
                  </span>
                {:else if direccionRevisada}
                  <span class="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-bold">
                    ✓ OK
                  </span>
                {:else}
                  <span class="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-bold animate-pulse">
                    ⏳ Revisar
                  </span>
                {/if}
                {#if direccionAbierta}
                  <ChevronUp class="w-6 h-6 text-green-600" />
                {:else}
                  <ChevronDown class="w-6 h-6 text-gray-400" />
                {/if}
              </div>
            </button>
            
            {#if direccionAbierta}
              <div class="p-5 bg-white border-t-2 border-green-100 animate-slide-down">
                {#if pedido.cliente_direccion && direccionCompleta}
                  <div class="space-y-4">
                    <div class="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-5 border-2 border-green-200">
                      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p class="text-xs text-green-700 font-bold mb-1">👤 Destinatario</p>
                          <p class="font-semibold text-gray-900">{pedido.cliente_direccion.nombre_destinatario}</p>
                        </div>
                        
                        <div>
                          <p class="text-xs text-green-700 font-bold mb-1">📞 Teléfono</p>
                          <p class="font-semibold text-gray-900">{pedido.cliente_direccion.telefono}</p>
                        </div>
                        
                        {#if pedido.cliente_direccion.correo}
                          <div class="md:col-span-2">
                            <p class="text-xs text-green-700 font-bold mb-1">📧 Correo</p>
                            <p class="font-semibold text-gray-900">{pedido.cliente_direccion.correo}</p>
                          </div>
                        {/if}
                      </div>
                      
                      <div class="border-t-2 border-green-300 pt-4 mt-4">
                        <p class="text-xs text-green-700 font-bold mb-2">📍 Dirección Completa</p>
                        <div class="bg-white rounded-lg p-4 border border-green-200">
                          <p class="font-semibold text-gray-900 mb-1">
                            {pedido.cliente_direccion.calle} {pedido.cliente_direccion.numero_exterior}
                            {pedido.cliente_direccion.numero_interior ? `Int. ${pedido.cliente_direccion.numero_interior}` : ''}
                          </p>
                          <p class="text-gray-700">Col. {pedido.cliente_direccion.colonia}</p>
                          <p class="text-gray-700">
                            CP {pedido.cliente_direccion.codigo_postal} - {pedido.cliente_direccion.ciudad}, {pedido.cliente_direccion.estado}
                          </p>
                          <p class="text-gray-700">{pedido.cliente_direccion.pais}</p>
                        </div>
                      </div>
                      
                      <div class="border-t-2 border-green-300 pt-4 mt-4">
                        <p class="text-xs text-green-700 font-bold mb-2">📝 Referencias</p>
                        <p class="text-gray-700 bg-white rounded-lg p-3 border border-green-200">
                          {pedido.cliente_direccion.referencias}
                        </p>
                      </div>
                      
                      {#if pedido.cliente_direccion.ubicacion_maps}
                        <div class="pt-3">
                          <a 
                            href={pedido.cliente_direccion.ubicacion_maps} 
                            target="_blank"
                            rel="noopener noreferrer"
                            class="inline-flex items-center gap-2 text-green-700 hover:text-green-900 font-medium text-sm"
                          >
                            <MapPin class="w-4 h-4" />
                            Ver en Google Maps →
                          </a>
                        </div>
                      {/if}
                    </div>
                    
                    <div class="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg">
                      <p class="text-sm text-blue-900 font-medium">
                        💡 <strong>Verifica:</strong> Que todos los datos sean correctos y completos para generar la guía de envío.
                      </p>
                    </div>
                  </div>
                {:else}
                  <div class="bg-red-50 border-2 border-red-300 rounded-lg p-6 text-center">
                    <AlertCircle class="w-12 h-12 text-red-500 mx-auto mb-3" />
                    <p class="text-red-800 font-bold text-lg">⚠️ Dirección Incompleta</p>
                    <p class="text-red-600 text-sm mt-2 mb-4">
                      El cliente debe completar la información de envío antes de aprobar el pedido.
                    </p>
                    <div class="bg-white rounded-lg p-4 border-2 border-red-200 text-left">
                      <p class="text-sm text-red-800 font-bold mb-2">Debes rechazar este pedido porque:</p>
                      <ul class="text-sm text-red-700 space-y-1 list-disc list-inside">
                        <li>La dirección de envío no está completa</li>
                        <li>No se puede generar la guía sin dirección válida</li>
                        <li>El cliente recibirá un mensaje para completar los datos</li>
                      </ul>
                    </div>
                  </div>
                {/if}
              </div>
            {/if}
          </div>
        {:else}
          <div class="bg-blue-50 border-2 border-blue-300 rounded-xl p-4">
            <div class="flex items-center gap-3">
              <CheckCircle class="w-6 h-6 text-blue-600" />
              <div>
                <p class="font-bold text-blue-900">ℹ️ Pedido sin envío</p>
                <p class="text-sm text-blue-700">Este pedido es para recolección local, no requiere dirección de envío.</p>
              </div>
            </div>
          </div>
        {/if}

        <!-- ✅ CAMPO DE RECHAZO (solo visible si va a rechazar) -->
        <div class="bg-gray-50 border-2 border-gray-300 rounded-xl p-5">
          <label class="block text-base font-bold text-gray-900 mb-3">
            💬 Motivo de Rechazo (obligatorio si rechazas)
          </label>
          <textarea
            bind:value={motivoRechazo}
            placeholder="Ej: El comprobante está borroso y no se puede leer el monto, por favor envía una foto más clara. La dirección está incompleta, falta el código postal..."
            rows="4"
            class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none text-base"
          ></textarea>
          <p class="text-xs text-gray-600 mt-2">
            💡 Explica claramente qué debe corregir el cliente (mínimo 10 caracteres)
          </p>
        </div>

        <!-- ✅ INDICADOR DE PROGRESO -->
        {#if !puedeAprobar}
          <div class="bg-amber-50 border-2 border-amber-300 rounded-xl p-4 animate-pulse">
            <div class="flex items-center gap-3">
              <AlertCircle class="w-6 h-6 text-amber-600" />
              <div class="flex-1">
                <p class="font-bold text-amber-900">⏳ Revisión Pendiente</p>
                <div class="flex items-center gap-4 mt-2 text-sm">
                  <span class="flex items-center gap-2">
                    {comprobanteRevisado ? '✅' : '⏳'} Comprobante
                  </span>
                  {#if requiereEnvio}
                    <span class="flex items-center gap-2">
                      {direccionRevisada ? '✅' : '⏳'} Dirección
                    </span>
                  {/if}
                </div>
              </div>
            </div>
          </div>
        {:else}
          <div class="bg-green-50 border-2 border-green-300 rounded-xl p-4">
            <div class="flex items-center gap-3">
              <CheckCircle class="w-6 h-6 text-green-600" />
              <p class="font-bold text-green-900">✅ Revisión Completa - Puedes aprobar o rechazar</p>
            </div>
          </div>
        {/if}
      </div>

      <!-- ✅ FOOTER CON ACCIONES -->
      <div class="px-6 py-5 bg-gray-50 border-t-2 border-gray-200 sticky bottom-0 z-10">
        <div class="flex flex-col gap-3">
          <button
            type="button"
            on:click={() => validar(false)}
            disabled={loading}
            class="w-full px-5 py-4 bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-lg flex items-center justify-center gap-3 transition-all transform hover:scale-[1.02] shadow-lg"
          >
            {#if loading}
              <Loader2 class="w-6 h-6 animate-spin" />
              <span>Procesando...</span>
            {:else}
              <XCircle class="w-6 h-6" />
              <span>❌ Rechazar Pedido</span>
            {/if}
          </button>
          
          <button
            type="button"
            on:click={() => validar(true)}
            disabled={loading || !puedeAprobar}
            class="w-full px-5 py-4 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-lg flex items-center justify-center gap-3 transition-all transform hover:scale-[1.02] shadow-lg"
          >
            {#if loading}
              <Loader2 class="w-6 h-6 animate-spin" />
              <span>Procesando...</span>
            {:else}
              <CheckCircle class="w-6 h-6" />
              <span>✅ Aprobar Pedido</span>
            {/if}
          </button>
          
          <button
            type="button"
            on:click={() => dispatch('close')}
            disabled={loading}
            class="w-full px-5 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition-all"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  </div>
</div>

<style>
  @keyframes slide-down {
    from {
      opacity: 0;
      max-height: 0;
    }
    to {
      opacity: 1;
      max-height: 2000px;
    }
  }
  
  .animate-slide-down {
    animation: slide-down 0.3s ease-out;
  }
</style>