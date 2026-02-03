<!-- src/routes/(admin)/categorias/+page.svelte -->
<script>
  import { onMount } from 'svelte';
  import { Tag, Plus, Edit, Trash2, CheckCircle2, X } from 'lucide-svelte';
  import CategoriaForm from '$lib/components/forms/CategoriaForm.svelte';
  
  let categorias = [];
  let loading = true;
  let mostrarFormulario = false;
  let categoriaEditando = null;
  let modoEdicion = false;
  let mensaje = { tipo: '', texto: '', visible: false };
  let mostrarModalEliminar = false;
  let categoriaAEliminar = null;
  
  onMount(async () => {
    await cargarCategorias();
  });
  
  async function cargarCategorias() {
    loading = true;
    try {
      const response = await fetch('/api/categorias');
      const result = await response.json();
      if (result.success) {
        categorias = result.data;
      }
    } catch (error) {
      console.error('Error cargando categorías:', error);
    } finally {
      loading = false;
    }
  }
  
  function abrirFormularioCrear() {
    categoriaEditando = null;
    modoEdicion = false;
    mostrarFormulario = true;
  }
  
  function abrirFormularioEditar(categoria) {
    categoriaEditando = categoria;
    modoEdicion = true;
    mostrarFormulario = true;
  }
  
  function cerrarFormulario() {
    mostrarFormulario = false;
    categoriaEditando = null;
    modoEdicion = false;
  }
  
  async function handleSuccess() {
    await cargarCategorias();
    cerrarFormulario();
    mostrarMensaje('success', modoEdicion ? 'Categoría actualizada' : 'Categoría creada');
  }
  
  function confirmarEliminar(categoria) {
    categoriaAEliminar = categoria;
    mostrarModalEliminar = true;
  }
  
  async function eliminarCategoria() {
    if (!categoriaAEliminar) return;
    
    try {
      const response = await fetch(`/api/categorias?id=${categoriaAEliminar.id}`, {
        method: 'DELETE'
      });
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error);
      }
      
      await cargarCategorias();
      mostrarMensaje('success', result.message);
      
    } catch (error) {
      mostrarMensaje('error', error.message);
    } finally {
      mostrarModalEliminar = false;
      categoriaAEliminar = null;
    }
  }
  
  function mostrarMensaje(tipo, texto) {
    mensaje = { tipo, texto, visible: true };
    setTimeout(() => { mensaje.visible = false; }, 5000);
  }
</script>

<div class="space-y-6">
  {#if mensaje.visible}
    <div class="fixed top-20 right-4 z-50 animate-slide-in">
      <div class={`rounded-lg shadow-lg p-4 flex items-center gap-3 ${
        mensaje.tipo === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
      }`}>
        <CheckCircle2 class="w-5 h-5 {mensaje.tipo === 'success' ? 'text-green-600' : 'text-red-600'}" />
        <span class={mensaje.tipo === 'success' ? 'text-green-700' : 'text-red-700'}>
          {mensaje.texto}
        </span>
        <button on:click={() => mensaje.visible = false}>
          <X class="w-4 h-4" />
        </button>
      </div>
    </div>
  {/if}
  
  <div class="flex justify-between items-center">
    <div>
      <h1 class="text-2xl font-bold text-gray-800">Gestión de Categorías</h1>
      <p class="text-gray-600">Organiza tus productos por categorías</p>
    </div>
    {#if !mostrarFormulario}
      <button on:click={abrirFormularioCrear} class="btn-primary flex items-center gap-2">
        <Plus class="w-5 h-5" />
        Nueva Categoría
      </button>
    {/if}
  </div>
  
  {#if mostrarFormulario}
    <div class="bg-gray-50 rounded-xl p-6 border-2 border-primary-200">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-xl font-bold text-gray-800">
          {modoEdicion ? 'Editar' : 'Crear'} Categoría
        </h2>
        <button on:click={cerrarFormulario} class="p-2 hover:bg-gray-200 rounded-lg">
          <X class="w-5 h-5" />
        </button>
      </div>
      
      <CategoriaForm
        categoria={categoriaEditando}
        {modoEdicion}
        on:success={handleSuccess}
        on:cancel={cerrarFormulario}
      />
    </div>
  {:else}
    <div class="bg-white rounded-xl shadow-sm p-6">
      {#if loading}
        <div class="text-center py-12">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p class="mt-4 text-gray-600">Cargando categorías...</p>
        </div>
      {:else if categorias.length === 0}
        <div class="text-center py-12">
          <Tag class="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 class="text-lg font-semibold text-gray-700 mb-2">No hay categorías</h3>
          <p class="text-gray-500 mb-6">Crea tu primera categoría para organizar productos</p>
          <button on:click={abrirFormularioCrear} class="btn-primary">
            Crear primera categoría
          </button>
        </div>
      {:else}
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {#each categorias as categoria}
            <div class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div class="flex items-start justify-between mb-3">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                    <Tag class="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <h3 class="font-semibold text-gray-800">{categoria.nombre}</h3>
                    <p class="text-xs text-gray-500">Orden: {categoria.orden}</p>
                  </div>
                </div>
                <span class={`px-2 py-1 text-xs rounded-full ${
                  categoria.activo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {categoria.activo ? 'Activo' : 'Inactivo'}
                </span>
              </div>
              
              {#if categoria.descripcion}
                <p class="text-sm text-gray-600 mb-3 line-clamp-2">{categoria.descripcion}</p>
              {/if}
              
              <div class="flex items-center justify-between pt-3 border-t border-gray-100">
                <span class="text-xs text-gray-500">slug: {categoria.slug}</span>
                <div class="flex gap-2">
                  <button
                    on:click={() => abrirFormularioEditar(categoria)}
                    class="p-1 text-blue-600 hover:bg-blue-50 rounded"
                    title="Editar"
                  >
                    <Edit class="w-4 h-4" />
                  </button>
                  <button
                    on:click={() => confirmarEliminar(categoria)}
                    class="p-1 text-red-600 hover:bg-red-50 rounded"
                    title="Eliminar"
                  >
                    <Trash2 class="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  {/if}
</div>

<!-- Modal de confirmación de eliminación -->
{#if mostrarModalEliminar && categoriaAEliminar}
  <div class="fixed inset-0 z-50 overflow-y-auto">
    <div class="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
      <!-- Backdrop -->
      <div 
        class="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
        on:click={() => mostrarModalEliminar = false}
      ></div>

      <!-- Modal -->
      <div class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
        <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
          <div class="sm:flex sm:items-start">
            <div class="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
              <svg class="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
              </svg>
            </div>
            <div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
              <h3 class="text-lg leading-6 font-medium text-gray-900">
                Eliminar Categoría
              </h3>
              <div class="mt-2">
                <p class="text-sm text-gray-500 mb-3">
                  ¿Estás seguro de que deseas eliminar <strong>{categoriaAEliminar.nombre}</strong>?
                </p>
                <div class="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p class="text-sm text-blue-800">
                    ℹ️ La categoría seguirá disponible en el historial de pedidos que la utilizan.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse gap-2">
          <button
            on:click={eliminarCategoria}
            class="w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
          >
            Eliminar
          </button>
          <button
            on:click={() => mostrarModalEliminar = false}
            class="mt-3 w-full inline-flex justify-center rounded-lg border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}