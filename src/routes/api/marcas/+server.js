// src/routes/api/marcas/+server.js

import { json } from '@sveltejs/kit';
import { supabase } from '$lib/supabaseClient';
import { supabaseAdmin } from '$lib/supabaseServer';

// ========================================
// GET - Listar marcas
// ========================================
export async function GET({ url }) {
  try {
    const activas = url.searchParams.get('activas');
    const incluirEliminadas = url.searchParams.get('incluir_eliminadas');
    
    let query = supabase
      .from('marcas')
      .select('*')
      .order('nombre', { ascending: true });
    
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
      data: data || []
    });
  } catch (error) {
    console.error('Error GET marcas:', error);
    return json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// ========================================
// POST - Crear marca
// ========================================
export async function POST({ request }) {
  try {
    const body = await request.json();
    
    if (!body.nombre?.trim()) {
      return json(
        { success: false, error: 'El nombre es obligatorio' },
        { status: 400 }
      );
    }
    
    const marcaData = {
      nombre: body.nombre.trim(),
      descripcion: body.descripcion?.trim() || null,
      logo_url: body.logo_url?.trim() || null,
      activo: body.activo !== false,
      eliminado: false
    };
    
    console.log('📤 Creando marca con supabaseAdmin:', marcaData);
    
    const { data, error } = await supabaseAdmin
      .from('marcas')
      .insert([marcaData])
      .select()
      .single();
    
    if (error) {
      console.error('❌ Error Supabase:', error);
      if (error.code === '23505') {
        return json(
          { success: false, error: 'Ya existe una marca con ese nombre' },
          { status: 409 }
        );
      }
      throw error;
    }
    
    console.log('✅ Marca creada:', data);
    
    return json({
      success: true,
      data,
      message: 'Marca creada exitosamente'
    }, { status: 201 });
    
  } catch (error) {
    console.error('❌ Error POST marca:', error);
    return json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// ========================================
// PUT - Actualizar marca
// ========================================
export async function PUT({ request }) {
  try {
    const body = await request.json();
    
    if (!body.id) {
      return json(
        { success: false, error: 'ID de marca requerido' },
        { status: 400 }
      );
    }
    
    const updateData = {};
    const camposPermitidos = ['nombre', 'descripcion', 'logo_url', 'activo'];
    
    camposPermitidos.forEach(campo => {
      if (body[campo] !== undefined) {
        updateData[campo] = body[campo];
      }
    });
    
    if (updateData.nombre) {
      updateData.nombre = updateData.nombre.trim();
    }
    
    console.log('📤 Actualizando marca con supabaseAdmin:', updateData);
    
    const { data, error } = await supabaseAdmin
      .from('marcas')
      .update(updateData)
      .eq('id', body.id)
      .select()
      .single();
    
    if (error) throw error;
    
    console.log('✅ Marca actualizada:', data);
    
    return json({
      success: true,
      data,
      message: 'Marca actualizada exitosamente'
    });
    
  } catch (error) {
    console.error('❌ Error PUT marca:', error);
    return json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// ========================================
// DELETE - Soft delete de marca
// ========================================
export async function DELETE({ url }) {
  try {
    const id = url.searchParams.get('id');
    
    if (!id) {
      return json(
        { success: false, error: 'ID de marca requerido' },
        { status: 400 }
      );
    }
    
    // Verificar si hay productos usando esta marca
    const { data: productosConMarca, error: errorCheck } = await supabase
      .from('productos')
      .select('id')
      .eq('marca_id', id)
      .eq('eliminado', false)
      .limit(1);
    
    if (errorCheck) throw errorCheck;
    
    const tieneProductos = productosConMarca && productosConMarca.length > 0;
    
    // Soft delete
    const { data, error } = await supabaseAdmin
      .from('marcas')
      .update({ 
        eliminado: true,
        fecha_eliminacion: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    console.log('✅ Marca archivada:', id);
    
    return json({
      success: true,
      data,
      message: tieneProductos 
        ? 'Marca archivada. Seguirá disponible en el historial de productos.'
        : 'Marca eliminada exitosamente'
    });
    
  } catch (error) {
    console.error('❌ Error DELETE marca:', error);
    return json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}