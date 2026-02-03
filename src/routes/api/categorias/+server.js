// src/routes/api/categorias/+server.js
import { json } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/supabaseServer';
import { generateSlug } from '$lib/supabaseClient';

// ========================================
// GET - Listar categorías
// ========================================
export async function GET({ url }) {
  try {
    const activas = url.searchParams.get('activas');
    const incluirEliminadas = url.searchParams.get('incluir_eliminadas');
    
    let query = supabaseAdmin
      .from('categorias')
      .select('*')
      .order('orden', { ascending: true });
    
    // Por defecto, filtrar eliminadas
    if (incluirEliminadas !== 'true') {
      query = query.eq('eliminado', false);
    }
    
    if (activas === 'true') {
      query = query.eq('activo', true);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    return json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Error GET categorías:', error);
    return json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// ========================================
// POST - Crear categoría
// ========================================
export async function POST({ request }) {
  try {
    const body = await request.json();
    
    if (!body.nombre) {
      return json(
        { success: false, error: 'El nombre es requerido' },
        { status: 400 }
      );
    }
    
    // Generar slug único
    let slug = body.slug || generateSlug(body.nombre);
    
    // Verificar slug único (solo entre no eliminadas)
    const { data: existingSlug } = await supabaseAdmin
      .from('categorias')
      .select('slug')
      .eq('slug', slug)
      .eq('eliminado', false)
      .single();
    
    if (existingSlug) {
      slug = `${slug}-${Date.now()}`;
    }
    
    const categoriaData = {
      nombre: body.nombre,
      descripcion: body.descripcion || null,
      slug,
      orden: body.orden || 0,
      activo: body.activo !== undefined ? body.activo : true,
      eliminado: false
    };
    
    const { data, error } = await supabaseAdmin
      .from('categorias')
      .insert(categoriaData)
      .select()
      .single();
    
    if (error) throw error;
    
    return json({
      success: true,
      data,
      message: 'Categoría creada exitosamente'
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error POST categoría:', error);
    return json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// ========================================
// PUT - Actualizar categoría
// ========================================
export async function PUT({ request }) {
  try {
    const body = await request.json();
    
    if (!body.id) {
      return json(
        { success: false, error: 'ID de categoría requerido' },
        { status: 400 }
      );
    }
    
    const updateData = {};
    const camposPermitidos = ['nombre', 'descripcion', 'slug', 'orden', 'activo'];
    
    camposPermitidos.forEach(campo => {
      if (body[campo] !== undefined) {
        updateData[campo] = body[campo];
      }
    });
    
    const { data, error } = await supabaseAdmin
      .from('categorias')
      .update(updateData)
      .eq('id', body.id)
      .select()
      .single();
    
    if (error) throw error;
    
    return json({
      success: true,
      data,
      message: 'Categoría actualizada exitosamente'
    });
    
  } catch (error) {
    console.error('Error PUT categoría:', error);
    return json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// ========================================
// DELETE - Soft delete de categoría
// ========================================
export async function DELETE({ url }) {
  try {
    const id = url.searchParams.get('id');
    
    if (!id) {
      return json(
        { success: false, error: 'ID de categoría requerido' },
        { status: 400 }
      );
    }
    
    // Verificar si tiene productos asociados
    const { data: productosAsociados } = await supabaseAdmin
      .from('productos')
      .select('id')
      .eq('categoria_id', id)
      .eq('eliminado', false)
      .limit(1);
    
    const tieneProductos = productosAsociados && productosAsociados.length > 0;
    
    // Soft delete
    const { data, error } = await supabaseAdmin
      .from('categorias')
      .update({ 
        eliminado: true,
        fecha_eliminacion: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    return json({
      success: true,
      data,
      message: tieneProductos 
        ? 'Categoría archivada. Seguirá disponible en el historial de pedidos.'
        : 'Categoría eliminada exitosamente'
    });
    
  } catch (error) {
    console.error('Error DELETE categoría:', error);
    return json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}