var Index = function() {

    var carregarPedidoChamado = function() {

        console.log('chamando pedido.')

        $.ajax({
            async: true,
            type: 'GET',
            url: API_URL + 'order/called',
            dataType: 'JSON',
            crossDomain: true,
            processData: true,
            success: function(data) {
                if (data != null) {
                    console.log('DADOS DO PEDIDO = ' + JSON.stringify(data));
                    $('#num-pedido').text(data.id);
                }
            },
            error: function(data) {
                var mensagem = (data.status == 0 ? data.statusText : data.responseJSON.responseText);
                console.log('OCORREU ALGO EM BUSCAR O NÚMERO DO PEDIDO = ' + mensagem);
                $('#num-pedido').text(mensagem);
            }
        });
    };

    return {
        inicializar: function() {
            carregarPedidoChamado();
            $('#btn-recarregar-num-pedido').click(carregarPedidoChamado);
        }
    };
}();