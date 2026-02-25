// supabase.js - Librería simplificada para Cuadros App

(function(global) {
    'use strict';
    
    // Configuración básica de Supabase
    function createClient(supabaseUrl, supabaseKey) {
        return {
            from: function(table) {
                return new SupabaseQuery(supabaseUrl, supabaseKey, table);
            }
        };
    }
    
    // Clase para construir consultas
    function SupabaseQuery(url, key, table) {
        this.url = url;
        this.key = key;
        this.table = table;
        this.filters = [];
        this.selectFields = '*';
    }
    
    SupabaseQuery.prototype.select = function(fields) {
        this.selectFields = fields || '*';
        return this;
    };
    
    SupabaseQuery.prototype.eq = function(column, value) {
        this.filters.push({ column: column, value: value, operator: 'eq' });
        return this;
    };
    
    SupabaseQuery.prototype.order = function(column, options) {
        this.orderBy = column;
        this.orderOptions = options || { ascending: true };
        return this;
    };
    
    // Ejecutar la consulta
    SupabaseQuery.prototype.execute = async function() {
        var url = this.url + '/rest/v1/' + this.table + '?select=' + this.selectFields;
        
        // Aplicar filtros
        for (var i = 0; i < this.filters.length; i++) {
            var f = this.filters[i];
            url += '&' + f.column + '=eq.' + encodeURIComponent(f.value);
        }
        
        if (this.orderBy) {
            url += '&order=' + this.orderBy + '.' + (this.orderOptions.ascending ? 'asc' : 'desc');
        }
        
        try {
            var response = await fetch(url, {
                method: 'GET',
                headers: {
                    'apikey': this.key,
                    'Authorization': 'Bearer ' + this.key,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                var errorText = await response.text();
                return { data: null, error: { message: errorText } };
            }
            
            var data = await response.json();
            return { data: data, error: null };
            
        } catch (err) {
            return { data: null, error: { message: err.message } };
        }
    };
    
    // Métodos que retornan promesas
    SupabaseQuery.prototype.then = function(onResolve, onReject) {
        return this.execute().then(onResolve, onReject);
    };
    
    // Insertar datos
    SupabaseQuery.prototype.insert = async function(records) {
        var url = this.url + '/rest/v1/' + this.table;
        
        try {
            var response = await fetch(url, {
                method: 'POST',
                headers: {
                    'apikey': this.key,
                    'Authorization': 'Bearer ' + this.key,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=minimal'
                },
                body: JSON.stringify(records)
            });
            
            if (!response.ok) {
                var errorText = await response.text();
                return { data: null, error: { message: errorText } };
            }
            
            return { data: records, error: null };
            
        } catch (err) {
            return { data: null, error: { message: err.message } };
        }
    };
    
    // Actualizar datos
    SupabaseQuery.prototype.update = async function(values) {
        var url = this.url + '/rest/v1/' + this.table;
        
        // Aplicar filtros a la URL
        for (var i = 0; i < this.filters.length; i++) {
            var f = this.filters[i];
            url += (i === 0 ? '?' : '&') + f.column + '=eq.' + encodeURIComponent(f.value);
        }
        
        try {
            var response = await fetch(url, {
                method: 'PATCH',
                headers: {
                    'apikey': this.key,
                    'Authorization': 'Bearer ' + this.key,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=minimal'
                },
                body: JSON.stringify(values)
            });
            
            if (!response.ok) {
                var errorText = await response.text();
                return { data: null, error: { message: errorText } };
            }
            
            return { data: values, error: null };
            
        } catch (err) {
            return { data: null, error: { message: err.message } };
        }
    };
    
    // Eliminar datos
    SupabaseQuery.prototype.delete = async function() {
        var url = this.url + '/rest/v1/' + this.table;
        
        for (var i = 0; i < this.filters.length; i++) {
            var f = this.filters[i];
            url += (i === 0 ? '?' : '&') + f.column + '=eq.' + encodeURIComponent(f.value);
        }
        
        try {
            var response = await fetch(url, {
                method: 'DELETE',
                headers: {
                    'apikey': this.key,
                    'Authorization': 'Bearer ' + this.key,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                var errorText = await response.text();
                return { data: null, error: { message: errorText } };
            }
            
            return { data: null, error: null };
            
        } catch (err) {
            return { data: null, error: { message: err.message } };
        }
    };
    
    // Exponer globalmente
    global.supabase = {
        createClient: createClient
    };
    
})(typeof window !== 'undefined' ? window : global);
