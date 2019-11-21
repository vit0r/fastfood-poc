var Produto = function() {

    /**
     * Apaga todos os valores dos campos de cadastro de poduto.
     */
    var inicializarCadastro = function() {
        configurarValorCampoModalEditar('#produto-id', '');
        configurarValorCampoModalEditar('#produto-nome', '');
        configurarValorCampoModalEditar('#produto-preco', '');
        configurarValorCampoModalEditar('#produto-categoria', '');
    }

    /**
     * Verifica se a opção selecionada é cadastro ou edição do produto.
     */
    var cadastrarEditarProduto = function() {
        if ($('#produto-id').val()) {
            editarProduto();
        } else {
            cadastrarProduto();
        }
    }

    /**
     * Cadastro de produto.
     */
    var cadastrarProduto = function() {
        var produto = {
            name: $('#produto-nome').val(),
            price: $('#produto-preco').val(),
            category: $('#produto-categoria').val(),
        };

        if (produto === null) {
            return;
        };

        console.log('Cadastrar do produto: ' + JSON.stringify(produto));

        $.ajax({
            async: true,
            type: 'POST',
            data: JSON.stringify(produto),
            url: API_URL + 'product',
            dataType: 'JSON',
            crossDomain: true,
            contentType: 'application/json; charset=utf-8',
            success: function(data) {
                if (data != null && data.status_code == 201) {
                    bootbox.alert(data.result);
                    inicializarCadastro();
                    carregarListaProdutos();
                }
            },
            error: function(data) {
                console.log(' ATENÇÃO OCORREU ALGO [PRODUTOS] =  ' + data.statusText);
                bootbox.alert('Ocorreu um erro ao tentar cadastrar o produto.');
            }
        });
    }

    /**
     * Mostra modal de edição do produto com os valores atuais preenchidos nos campos.
     */
    var mostrarModalEditar = function() {
        var id = $(this).attr('id-objeto');
        $.ajax({
            async: true,
            type: 'GET',
            url: API_URL + 'product/' + id,
            dataType: 'JSON',
            crossDomain: true,
            contentType: 'application/json; charset=utf-8',
            success: function(data) {
                if (data != null) {
                    configurarValorCampoModalEditar('#produto-id', data.id);
                    configurarValorCampoModalEditar('#produto-nome', data.name);
                    configurarValorCampoModalEditar('#produto-preco', data.price);
                    configurarValorCampoModalEditar('#produto-categoria', data.category);
                    $('#cadastrarProdutoModal').modal('toggle');
                }
            },
            error: function(data) {
                console.log(' ATENÇÃO OCORREU ALGO [PRODUTOS] =  ' + data.statusText);
                bootbox.alert('Ocorreu um erro ao carregar informações atuais do produto.');
            }
        });
    };

    /**
     * Repassa os valores para os campos HTML na opção editar
     * @param {Campo INPUT HTML} field 
     * @param {Valor da propriedade do objeto produto} value 
     */
    var configurarValorCampoModalEditar = function(field, value) {
        $('#cadastrarProdutoModal ' + field).val(value)
    };

    /**
     * Efetua a ação editar enviando os dados para API.
     */
    var editarProduto = function() {
        var id = $('#produto-id').val();

        var produto = {
            id: $('#produto-id').val(),
            name: $('#produto-nome').val(),
            price: $('#produto-preco').val(),
            category: $('#produto-categoria').val(),
        };

        console.log('Editar do produto: ' + JSON.stringify(produto));

        $.ajax({
            async: true,
            type: 'PUT',
            url: API_URL + 'product/' + id,
            dataType: 'JSON',
            data: JSON.stringify(produto),
            crossDomain: true,
            contentType: 'application/json; charset=utf-8',
            success: function(data) {
                if (data != null && data.status_code == 202) {
                    $('#produto-id').val(data.id);
                    $('#produto-nome').val(data.nome);
                    $('#produto-preco').val(data.price);
                    $('#produto-categoria').val(data.category);
                    bootbox.alert(data.result);
                    inicializarCadastro();
                    carregarListaProdutos();
                    $('#cadastrarProdutoModal').modal('toggle');
                }
            },
            error: function(data) {
                console.log(' ATENÇÃO OCORREU ALGO [PRODUTOS] =  ' + data.statusText);
                bootbox.alert('Ocorreu um erro ao editar informações do produto.');
            }
        });
    };

    /**
     * Remove produto.
     */
    var removerProduto = function() {
        var id = $(this).attr('id-objeto');

        console.log('Remover produto de código ' + id);

        bootbox.confirm('Tem certeza que deseja remover?', function(result) {
            if (result) {
                $.ajax({
                    async: true,
                    type: 'DELETE',
                    url: API_URL + 'product/' + id,
                    dataType: 'JSON',
                    crossDomain: true,
                    processData: true,
                    success: function(data) {
                        if (data != null && data.status_code == 202) {
                            bootbox.alert(data.result);
                            carregarListaProdutos();
                        }
                    },
                    error: function(data) {
                        console.log(' ATENÇÃO OCORREU ALGO [PRODUTOS] =  ' + data.statusText);
                        bootbox.alert('Ocorreu um erro ao tentar remover o produto.');
                    }
                });
            }
        });
    };

    /**
     * Adiciona eventos para os botões de ação para cada produto na tabela.
     */
    var adicionarEventos = function() {
        $('.table-products .btn-editar').each(function() {
            $(this).click(mostrarModalEditar);
        });
        $('.table-products .btn-danger').each(function() {
            $(this).click(removerProduto);
        });
    };

    /**
     * Carrega lista de produtos cadastrados.
     */
    var carregarListaProdutos = function() {
        $.ajax({
            async: true,
            type: 'GET',
            url: API_URL + 'product/',
            dataType: 'JSON',
            crossDomain: true,
            processData: true,
            beforeSend: function() {
                limparListaProdutos();
            },
            success: function(data) {

                console.log('Listar produtos: ' + JSON.stringify(data));

                if (data != null) {
                    $.each(data, function(index, item) {
                        var index = 5;
                        var tr = $('<tr/>');
                        tr.append("<td class='text-right'>" + item.id + "</td>");
                        tr.append("<td>" + item.name + "</td>");
                        tr.append("<td class='text-right'>" + Utils.formatarValorMonetario(item.price) + "</td>");
                        tr.append("<td>" + item.category + "</td>");
                        var template = "<td>";
                        template += "<div class='btn-group btn-group-xs btn-group-show-label'>";
                        template += "<button type='button' name='botao-editar' id='botao-editar' id-objeto='" +
                            item.id + "' class='btn btn-info btn-editar' index='" + index + "'>Editar</button>";
                        index++;
                        template += "<button type='button' name='botao-remover' id='botao-remover' id-objeto='" +
                            item.id + "' class='btn btn-danger' index='" + index + "'>Remover</button>";
                        template += "</div>";
                        template += "</td>";
                        tr.append(template);
                        $('.table-products').append(tr);
                    });
                    adicionarEventos();
                }
            },
            error: function(data) {
                console.log(' ATENÇÃO OCORREU ALGO [PRODUTOS] =  ' + data.statusText);
                bootbox.alert('Nenhum produto foi encontrado.');
            }
        });
    };

    /**
     * Limpa a tabela de produtos.
     */
    var limparListaProdutos = function() {
        $('.table-products').empty();
    };

    /**
     * Externaliza a função inicializar, aplica eventos nos botões e carrega lista de produtos ao acessar a tela de manutenção de produtos. 
     */
    return {
        inicializar: function() {
            $('#btn-cadastrar-produto').click(cadastrarEditarProduto);
            $('#btn-cadastrar-produto-modal').click(inicializarCadastro);
            carregarListaProdutos();
        }
    };
}();