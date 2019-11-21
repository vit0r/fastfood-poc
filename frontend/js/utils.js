var Utils = function() {

    //Registra formatação dos valor monetário BRL
    numeral.register('locale', 'pt-br', {
        delimiters: {
            thousands: '.',
            decimal: ','
        },
        abbreviations: {
            thousand: 'mil',
            million: 'milhões',
            billion: 'b',
            trillion: 't'
        },
        ordinal: function(number) {
            return 'º';
        },
        currency: {
            symbol: 'R$'
        }
    });

    /**
     * Aplica mascara montária para valor numerico.
     * @param {Float} valorMonetario 
     */
    var formatarValorMonetario = function(valorMonetario) {
        numeral.locale('pt-br');
        var valorMonetarioFormatado = numeral(valorMonetario).format('$0,0.00');
        return valorMonetarioFormatado;
    };

    return {
        formatarValorMonetario: formatarValorMonetario
    };
}();