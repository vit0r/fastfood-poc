    var Pedido = function() {

        var listaProdutos = new Array();
        var pedidoAtual = new Array();

        /**
         * Busca lista de pedidos cadastrados.
         */
        var carregarListaPedidos = function() {
            $.ajax({
                async: true,
                type: 'GET',
                url: API_URL + 'order',
                dataType: 'JSON',
                processData: true,
                crossDomain: true,
                beforeSend: function() {
                    limparListaPedidos();
                },
                success: function(data) {
                    if (data != null) {
                        $.each(data, function(index, item) {
                            var template = "<div class='jumbotron col-md-5 col-md-offset-1'>";
                            template += "<p>Número do pedido: " + item.id + "</p>";
                            template += "<p>Valor Total: " + Utils.formatarValorMonetario(item.price) + "</p>";
                            template += "<p>Quantidade de itens: " + item.quantity + "</p>";
                            if (!item.is_called) {
                                template += "<button id='" + item.id + "' class='btn-chamar-pedido btn btn-info'>Chamar</button>";
                            } else if (!item.is_sentent && item.is_called) {
                                template += "<button id='" + item.id + "' class='btn-chamar-pedido btn btn-info'>Chamar</button>";
                                template += "<button id='" + item.id + "' class='btn-retirar-pedido btn btn-warnning'>Retirar pedido</button>";
                            } else {
                                template += "<div style='text-align: center; width: 100%;'>";
                                template += "<span class='label label-success'>RETIRADO</span>";
                                template += "</div>"
                            }
                            template += "</div>";
                            $(template).appendTo(".card-group");
                        });
                        adicionarEventosChamarPedido();
                    }
                },
                error: function(data) {
                    console.log(' ATENÇÃO OCORREU ALGO [PEDIDOS] = ' + data.statusText);
                    bootbox.alert('Nenhum pedido encontrado.');
                }
            });
        };

        /**
         * Busca por produtos cadastrados.
         */
        var pesquisarProduto = function() {
            var nomeProduto = $('#produto-nome').val();

            if (nomeProduto !== '') {
                nomeProduto += '/name';
            }

            $.ajax({
                async: true,
                type: 'GET',
                url: API_URL + 'product/' + nomeProduto,
                dataType: 'JSON',
                crossDomain: true,
                processData: true,
                beforeSend: function() {
                    limparListaProdutosPedidos();
                },
                success: function(data) {
                    if (data != null) {
                        $.each(data, function(index, item) {
                            produto = reCalcularAtualizarProdutos(item);
                            var tr = $('<tr/>');
                            tr.append("<td class='text-right'>" + produto.id + "</td>");
                            tr.append("<td>" + produto.name + "</td>");
                            tr.append("<td class='text-right'>" + Utils.formatarValorMonetario(produto.price) + "</td>");
                            tr.append("<td>" + produto.category + "</td>");
                            tr.append("<td><input class='pedido-quantidade text-right' id='" + produto.id + "' type='number' min='0' value='" + produto.quantity + "' name='pedido-quantidade'></td>");
                            tr.append("<td class='text-right'><b id='sub-total" + produto.id + "'>" + Utils.formatarValorMonetario(produto.subTotal) + "</b></td>");
                            $('.table-produtos-pedido').append(tr);
                        });
                        listaProdutos = data;
                        console.log('Lista de produtos = ' + JSON.stringify(data));
                        adicionarEventosProdutoPedido();
                    }
                },
                error: function(data) {
                    console.log('Nome pesquisado = ' + $('#produto-nome').val());
                    console.log('ATENÇÃO OCORREU ALGO [PEDIDOS] = ' + data.statusText);
                    bootbox.alert('Nenhum produto encontrado.');
                }
            });
        };

        /**
         * Adiciona ação para os botões contruidos por demanda na lista de pedidos cadastrados.
         */
        var adicionarEventosChamarPedido = function() {
            $('.btn-chamar-pedido').each(function() {
                $(this).click(chamarPedido);
            });
            $('.btn-retirar-pedido').each(function() {
                $(this).click(retirarPedido);
            });
        };

        /**
         * Adiciona ação para os botões de inserir ou remover quantidade para um determinado produto ao pedido atual
         */
        var adicionarEventosProdutoPedido = function() {
            $('.pedido-quantidade').each(function() {
                $(this).change(calcularQuantidadeProduto);
                $(this).keyup(calcularQuantidadeProduto);
            });
        };

        /**
         * Limpa a lista de pedidos cadastrados.
         */
        var limparListaPedidos = function() {
            $('.card-group').empty();
        };

        /**
         * Limpa a lista de produtos pesquisados.
         */
        var limparListaProdutosPedidos = function() {
            $('.table-produtos-pedido').empty();
        };

        /**
         * Calcula a quantidade de um determinado produto no pedido ao acionar o evento de adicionar ou remover do campo quantidade
         */
        var calcularQuantidadeProduto = function() {

            var quantidade = $(this).val().replace(/[^0-9]/g, '');

            if (quantidade == '') {
                $(this).val('');
                return;
            }

            if (listaProdutos.length == 0) {
                bootbox.alert('Lista de produtos está vazia.');
                return;
            }

            produtoId = parseInt($(this).attr('id'));

            var produto = _.find(listaProdutos, function(p) { return p.id == produtoId; });
            if (produto == null) {
                bootbox.alert('Erro ao selecionar o produto de código = ' + $(this).attr('id'));
                return;
            }
            processaPedidoAtual(quantidade, produto);
            atualizaTotalPedido();
        };

        /**
         * Recebe a quantidade solicitada para um determinado produto e processa o pedido atual.
         * Caso um produto ainda não esteja na lista de pedido atual o produto é adicionado.
         * Caso o produto exista na lista de pedido atual a quantidade para o mesmo é atualizada.
         * Caso o produto estiver quando a quantidade selecionada igual a zero o produto é removido do pedido atual.
         * @param {integer} quantidade 
         * @param {Produto} produtoPedido 
         */
        var processaPedidoAtual = function(quantidade, produtoPedido) {
            quantidade = parseInt(quantidade);
            var produto = _.find(pedidoAtual, function(o) { return o.id == produtoPedido.id; });
            // Remove produto do pedido quando a quantidade for igual a zero.
            if (quantidade == 0 && produto != null) {
                removerProduto(produto);
                reCalcularPedidoQuantidade(produto, quantidade);
                return;
            }
            // Adiciona o produto ao pedido caso ainda não exsita.
            if (produto == null) {
                produtoPedido = reCalcularPedidoQuantidade(produtoPedido, quantidade);
                pedidoAtual.push(produtoPedido);
            } else {
                // Atualiza a quantidade do produto existente no pedido.
                produto = reCalcularPedidoQuantidade(produto, quantidade);
            }
        };

        /**
         * Remove produto do pedido atual quando a quantidade for iqual a zero
         * @param {produto} Objeto Produto
         */
        var removerProduto = function(produto) {
            if (pedidoAtual.length > 0) {
                try {
                    _.remove(pedidoAtual, function(p) { return p.id == produto.id; });
                    atualizaSubTotalPedido(produto);
                } catch (err) {
                    console.log('Tentativa de remoção do item do pedido ' + err);
                }
            }
        };

        /**
         * Finaliza pedido e gera um pedido na lista de pedidos cadastrados
         */
        var finalizarPedido = function() {
            if (pedidoAtual.length > 0) {

                sortedList = _.sortBy(pedidoAtual, ['id']);
                var produtos = JSON.stringify({ 'products': sortedList });

                console.log('Cadastro de pedido: ' + produtos);

                $.ajax({
                    async: true,
                    type: 'POST',
                    url: API_URL + 'order',
                    dataType: 'JSON',
                    data: produtos,
                    crossDomain: true,
                    processData: true,
                    contentType: 'application/json; charset=utf-8',
                    beforeSend: function() {
                        desativaAcaoBotoesFinalizarPedido(true);
                        desativaAcaoCamposFinalizarPedido(true);
                    },
                    success: function(data) {
                        bootbox.alert(data.result);
                    },
                    error: function(data) {
                        console.log(' ATENÇÃO OCORREU ALGO [PEDIDOS] = ' + data.statusText);
                        bootbox.alert('Ocorreu um erro ao finalizar pedido.');
                    },
                    complete: function() {
                        limparPedido();
                        desativaAcaoBotoesFinalizarPedido(false);
                        desativaAcaoCamposFinalizarPedido(false);
                    }
                });
            } else {
                bootbox.alert('O pedido está vazio.');
            }
        };

        /**
         * Aciona o áudio chamando pelo número do pedido
         */
        var chamarPedido = function() {

            var idPedido = $(this).attr('id');

            console.log('chamar pedido = ' + idPedido);

            $.ajax({
                async: true,
                type: 'PUT',
                url: API_URL + 'order/' + idPedido + '/call',
                dataType: 'JSON',
                crossDomain: true,
                processData: true,
                contentType: 'application/json; charset=utf-8',
                beforeSend: function() {
                    desativaAcaoBotoesChamarRetirarPedido(true);
                },
                success: function(data) {
                    carregarListaPedidos();
                    bootbox.alert(data.result);
                },
                error: function(data) {
                    console.log(' ATENÇÃO OCORREU ALGO [PEDIDOS] = ' + data.statusText);
                    bootbox.alert('Ocorreu um erro ao chamar pedido.');
                },
                complete: function() {
                    desativaAcaoBotoesChamarRetirarPedido(false);
                }
            });
        };

        /**
         * Retira pedido da lista de pedidos chamados.
         */
        var retirarPedido = function() {
            var idPedido = $(this).attr('id');

            console.log('retirar pedido = ' + idPedido);

            $.ajax({
                async: true,
                type: 'PUT',
                url: API_URL + 'order/' + idPedido + '/sent',
                dataType: 'JSON',
                crossDomain: true,
                processData: true,
                contentType: 'application/json; charset=utf-8',
                beforeSend: function() {
                    desativaAcaoBotoesChamarRetirarPedido(true);
                },
                success: function(data) {
                    carregarListaPedidos();
                    bootbox.alert(data.result);
                },
                error: function(data) {
                    console.log(' ATENÇÃO OCORREU ALGO [PEDIDOS] = ' + data.statusText);
                    bootbox.alert('Ocorreu um erro ao retirar pedido.');
                },
                complete: function() {
                    desativaAcaoBotoesChamarRetirarPedido(false);
                }
            });
        };

        /**
         * Limpar pedido - remove todos os itens da lista de pedidoAtual
         */
        var limparPedido = function() {
            if (pedidoAtual.length > 0) {
                pedidoAtual = new Array();
                atualizaTotalPedido();
                pesquisarProduto();
            } else {
                bootbox.alert('O pedido está vazio.');
            }
        };

        /**
         * Atualiza o calculo do valor do pedido quando a lista de produtos é atualizada.
         * @param {Produto} produto 
         */
        var reCalcularAtualizarProdutos = function(produto) {
            var produtoPedido = _.find(pedidoAtual, function(o) { return o.id == produto.id; });
            if (produtoPedido == null) {
                var propriedadesProd = {
                    'quantity': 0,
                    'subTotal': 0,
                };
                _.assign(produto, propriedadesProd);
            } else {
                var propriedadesProd = {
                    'quantity': produtoPedido.quantity,
                    'subTotal': produto.price * produtoPedido.quantity,
                };
                _.assign(produto, propriedadesProd);
            }
            atualizaSubTotalPedido(produto);
            return produto;
        };

        /**
         * Atualiza o calculo do valor do pedido quando a quantidade é modificada.
         * @param {Produto} produto 
         *  @param {Integer} quantidade 
         */
        var reCalcularPedidoQuantidade = function(produto, quantidade) {
            var propriedadesProd = {
                'quantity': quantidade,
                'subTotal': produto.price * quantidade,
            };
            _.assign(produto, propriedadesProd);
            atualizaSubTotalPedido(produto);
            return produto;
        };

        /**
         * Atualiza o valor vezzes quantidade de um determinado produto.
         * @param {Produto} produto 
         */
        var atualizaSubTotalPedido = function(produto) {
            var valorFormatado = Utils.formatarValorMonetario(produto.subTotal);
            $('#sub-total' + produto.id).text(valorFormatado);
        }

        /**
         * Calcula valor total do pedido.
         */
        var atualizaTotalPedido = function() {
            var totalPedido = _.sumBy(pedidoAtual, 'subTotal');
            var valorFormatado = Utils.formatarValorMonetario(totalPedido);
            $('#total-pedido').text(valorFormatado);
        }

        /**
         * Desabilita ou habilita botões ao executar a ação de finalizar o pedido.
         * @param {Boolean} opcao 
         */
        var desativaAcaoBotoesFinalizarPedido = function(opcao) {
            $('#btn-pesquisar-produto').prop('disabled', opcao);
            $('#btn-finalizar-pedido').prop('disabled', opcao);
            $('#btn-cancelar-pedido').prop('disabled', opcao);
        }

        /**
         * Desabilita ou habilita campos de input ao executar a ação de finalizar o pedido.
         * @param {Boolean} opcao 
         */
        var desativaAcaoCamposFinalizarPedido = function(opcao) {
            $('#produto-nome').prop('disabled', opcao);
        }

        /**
         * Desabilita ou habilita botões ao executar a ação de chamar ou retirar o pedido.
         * @param {Boolean} opcao 
         */
        var desativaAcaoBotoesChamarRetirarPedido = function(opcao) {
            $('.btn-chamar-pedido').prop('disabled', opcao);
            $('.btn-retirar-pedido').prop('disabled', opcao);
        }

        /**
         * Retona a instância dos objetos inicializados.
         * Exemplo: eventos de botões na tela atual ou carregamentos de listas ao solicitar a página.
         * Evento JQuery READY OK.
         */
        return {
            inicializarListagemPedido: function() {
                carregarListaPedidos();
            },

            inicializarCadastroPedido: function() {
                $('#btn-pesquisar-produto').click(pesquisarProduto);
                $('#btn-finalizar-pedido').click(finalizarPedido);
                $('#btn-cancelar-pedido').click(limparPedido);
                atualizaTotalPedido();
            }
        };
    }();