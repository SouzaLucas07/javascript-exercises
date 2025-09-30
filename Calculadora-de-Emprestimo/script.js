function calculate() {
    var amount = document.getElementById("amount");
    var apr = document.getElementById("apr");
    var years = document.getElementById("years");
    var zipcode = document.getElementById("zipcode");
    var payment = document.getElementById("payment");
    var total = document.getElementById("total");
    var totalinterest = document.getElementById("totalinterest");

    var principal = parseFloat(amount.value);
    var interest = parseFloat(apr.value) / 100 / 12;
    var payments = parseFloat(years.value) * 12;

    var x = Math.pow(1 + interest, payments);
    var monthly = (principal * x * interest) / (x - 1);

    if (isFinite(monthly)) {
        payment.innerHTML = monthly.toFixed(2);
        total.innerHTML = (monthly * payment).toFixed(2);
        totalinterest.innerHTML = ((monthly * payments) - principal).toFixed(2);

        save(amount.value, apr.value, years.value, zipcode.value);

        try {
            getLenders(amount.value, apr.value, years.value, zipcode.value)
        }
        catch (e) { /* E ignora esses erros*/ }
        chart(principal, interest, monthly, payments);
    }
    else {
        payment.innerHTML = "";
        total = "";
        totalinterest = "";
        chart();
    }
}

function save(amount, apr, years, zipcode) {
    if (window.localStorage) {
        localStorage.loan_amount = amount;
        localStorage.loan_apr = apr;
        localStorage.loan_years = years;
        localStorage.loan_zipcode = zipcode;
    }
}

window.onload = function () {
    if (window.localStorage && localStorage.loan_amount) {
        document.getElementById("amount").value = localStorage.loan_amount;
        document.getElementById("apr").value = localStorage.loan_apr;
        document.getElementById("years").value = localStorage.loan_years;
        document.getElementById("zipcode").value = localStorage.loan_zipcode;
    }
}


function getLenders(amount, apr, years, zipcode) {
    if (!window.XMLHttpRequest) {
        return;
    }
    var ad = document.getElementById("lenders");
    if (!ad) {
        return
    }

    var url = "getlenders.php" +
        "?amt=" + endecodeURIComponent(amount) +

        "&apr=" + endecodeURIComponent(apr) +
        "&yrs=" + endecodeURIComponent(years) +
        "&zip=" + endecodeURIComponent(zipcode);

    var req = new XMLHttpRequest()
    req.open("GET", url);
    req.send(null);

    req.onreadystatechange = function () {
        if (req.readyState == 4 && req.status == 200) {
            var response = req.responseText;
            var lenders = JSON.parse(response);
            var list = "";
            for (var i = 0; i < lenders.length; i++) {
                list += "<li> <a href='" + lenders[i].url + "'>" + lenders[i].name + "</a>"
            }
            ad.innerHTML = "<ul>" + list + "</ul>";
        }
    }
}

function chart(principal, interest, monthly, payments) {
    var graph = document.getElementById("graph");
    graph.width = graph.width; // Limpa o canvas

    if (arguments.length === 0 || !graph.getContext) {
        return;
    }

    var g = graph.getContext("2d");
    var width = graph.width, height = graph.height;

    function paymentTox(n) {
        return n * width / payments;
    }

    function amountToy(a) {
        return height - (a * height / (monthly * payments * 1.05));
    }

    // Desenhar total de juros pagos
    g.beginPath();
    g.moveTo(paymentTox(0), amountToy(0));
    g.lineTo(paymentTox(payments), amountToy(monthly * payments));
    g.lineTo(paymentTox(payments), amountToy(0));
    g.closePath();
    g.fillStyle = "#f88";
    g.fill();
    g.font = "bold 12px sans-serif";
    g.fillText("Total Interest Payment", 20, 20);

    // Desenhar o total de patrimônio líquido
    var equity = 0;
    g.beginPath();
    g.moveTo(paymentTox(0), amountToy(0));

    for (var p = 1; p <= payments; p++) {
        var thisMonthsInterest = (principal - equity) * interest;
        equity += (monthly - thisMonthsInterest);
        g.lineTo(paymentTox(p), amountToy(equity));
    }
    g.lineTo(paymentTox(payments), amountToy(0));
    g.closePath();
    g.fillStyle = "green";
    g.fill();
    g.fillText("Total Equity", 20, 35);

    // Desenhar saldo restante
    var bal = principal;
    g.beginPath();
    g.moveTo(paymentTox(0), amountToy(bal));

    for (var p = 1; p <= payments; p++) {
        var thisMonthsInterest = bal * interest;
        bal -= (monthly - thisMonthsInterest);
        g.lineTo(paymentTox(p), amountToy(bal));
    }
    g.lineWidth = 3;
    g.stroke();
    g.fillStyle = "black";
    g.fillText("Loan Balance", 20, 50);
    g.textAlign = "center";

    // Adicionar marcas de ano no eixo X
    var y = amountToy(0);
    for (var year = 1; year * 12 <= payments; year++) {
        var x = paymentTox(year * 12);
        g.fillRect(x - 0.5, y - 3, 1, 3);
        if (year == 1) {
            g.fillText("Year", x, y - 5);
        }
        if (year % 5 === 0 && year * 12 !== payments) {
            g.fillText(String(year), x, y - 5);
        }
    }

    // Adicionar marcas no eixo Y
    g.textAlign = "right";
    g.textBaseline = "middle";
    var ticks = [monthly * payments, principal];
    var rightEdge = paymentTox(payments);

    for (var i = 0; i < ticks.length; i++) {
        var y = amountToy(ticks[i]);
        g.fillRect(rightEdge - 3, y - 0.5, 3, 1);
        g.fillText(String(ticks[i].toFixed(0)), rightEdge - 5, y);
    }
}
