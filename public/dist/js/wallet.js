function Wallet() {

    var componentCounter = 0;

    var seed = null;

    var Waves = null;

    var copied = false;

    // Payment method
    this.pay = function() {
        var addressTo = getEl('addressTo').value;
        var amount = getEl('amount').value;
        var currency = getEl('paymentCurrency').selectedIndex;
        if (validatePaymentFields(addressTo, amount)) {
            switch (currency) {
                case 1:
                    transfer(addressTo, amount, 'WAVES', '');
                    break;
                case 2:
                    if (checkAddress(addressTo)) {
                        transfer('3PDb1ULFjazuzPeWkF2vqd1nomKh4ctq9y2', amount, '7xHHNP8h6FrbP5jYZunYWgGn2KFSBiWcVaZWe644crjs', 'forward=' + addressTo);
                    } else {
                        transfer(addressTo, amount, '7xHHNP8h6FrbP5jYZunYWgGn2KFSBiWcVaZWe644crjs', '');
                    }
                    break;
                case 3:
                    if (web3.isAddress(addressTo)) {
                        transfer('3PDb1ULFjazuzPeWkF2vqd1nomKh4ctq9y2', amount, '4fJ42MSLPXk9zwjfCdzXdUDAH8zQFCBdBz4sFSWZZY53', 'forward=' + addressTo);
                    } else {
                        transfer(addressTo, amount, '4fJ42MSLPXk9zwjfCdzXdUDAH8zQFCBdBz4sFSWZZY53', '');
                    }
                    break;
                default:
                    transfer(addressTo, amount, '4zbprK67hsa732oSGLB6HzE8Yfdj3BcTcehCeTA1G5Lf', '');
            }
        }
    }

    // Copy method for copying address to clipboard
    this.copy = function(elId) {
        var copyText = document.getElementById(elId);
        copyText.select();
        document.execCommand("copy");
        $('#copymessage' + elId).fadeIn(function() {
            setTimeout(() => {
                $('#copymessage' + elId).fadeOut();
            }, 2000);
        });
    }

    // Saves user's nickname to blockchain
    this.save = function() {
        var nickname = getEl('nickname').value;
        if (validateNicknameFields(nickname)) {
            anonutopia.setNickname(nickname, function(error, result) {
                console.log(error);
            });
        }
    }

    // Exchange currencies
    this.exchange = function() {
        var selectedCurrency = getEl('currency').selectedIndex;
        var amount = getEl('amount').value;
        if (validateExchangeFields(selectedCurrency, amount)) {
            $('#content').fadeOut(function() {
                $('#transactionInProgress').fadeIn();
            });
            switch (selectedCurrency) {
                case 1:
                    btcToAno(amount);
                    break;
                case 2:
                    ethToAno(amount);
                    break;
                default:
                    wavToAno(amount);
            }
        }
    }

    // Withdraw ANT profit
    this.withdraw = function() {
        $('#withdrawmessage').fadeIn(function() {
            setTimeout(() => {
                $('#withdrawmessage').fadeOut();
            }, 2000);
        });
    }

    // Sign in method
    this.signIn = function() {
        var pass = getEl('password').value;
        if (validatePasswordField(pass)) {
            try {
                var restoredPhrase = Waves.Seed.decryptSeedPhrase(Cookies.get('encrypted'), pass);
                Cookies.set('seed', restoredPhrase, { expires: 1 });
                seed = Waves.Seed.fromExistingPhrase(restoredPhrase);
                Cookies.set('address', seed.address, { expires: 1 });
                window.location = '/';
            } catch (e) {
                setHTML('required', e);
                $('#required').fadeIn(function() {
                    setTimeout(() => {
                        $('#required').fadeOut();
                        $('#passwordGroup').removeClass('has-error');
                    }, 2000);
                });
            }
        }
    }

    // Sign out method
    this.signOut = function() {
        Cookies.remove('seed');
        window.location = '/sign-in/';
    }

    // Sign up next method
    this.signUpNext = function() {
        setValue('seedinput', allLocales.copyAgain);
        var copyText = document.getElementById("seedinput");
        copyText.select();
        document.execCommand("copy");
        $('#newGroup').fadeOut(function() {
            $('#newGroup1').fadeIn();
        });
    }

    // Sign up next method (second step)
    this.signUpNext1 = function() {
        var seedTa = getEl('seedta').value;
        if (validateSeedField(seedTa, true)) {
            $('#newGroup1').fadeOut(function() {
                $('#newGroup2').fadeIn();
            });
        }
    }

    // Sign up next method (third step)
    this.signUpNext2 = function() {
        var p1 = getEl('password1').value;
        var p2 = getEl('password2').value;
        if (validateSUPasswords(p1, p2)) {
            Cookies.set('seed', seed.phrase, { expires: 1 });
            Cookies.set('encrypted', seed.encrypt(p1), { expires: 365 });
            Cookies.set('address', seed.address, { expires: 1 });
            window.location = "/";
        }
    }

    // Sign out copy method
    this.signUpCopy = function() {
        var copyText = document.getElementById("seedinput");
        copyText.select();
        document.execCommand("copy");
        $('#copymessage').fadeIn(function() {
            setTimeout(() => {
                $('#copymessage').fadeOut();
            }, 2000);
        });
    }

    // Import next method
    this.importNext = function() {
        var seedTa = getEl('seedta').value;
        if (validateSeedField(seedTa, false)) {
            seed = Waves.Seed.fromExistingPhrase(seedTa);
            $('#importGroup1').fadeOut(function() {
                $('#importGroup2').fadeIn();
            });
        }
    }

    // Import next method (second step)
    this.importNext1 = function() {
        var p1 = getEl('password1').value;
        var p2 = getEl('password2').value;
        if (validateSUPasswords(p1, p2)) {
            Cookies.set('seed', seed.phrase, { expires: 1 });
            Cookies.set('encrypted', seed.encrypt(p1), { expires: 365 });
            Cookies.set('address', seed.address, { expires: 1 });
            window.location = "/";
        }
    }

    // PRIVATE METHODS

    // Constructor method
    function constructor() {
        $(".sidebar-menu a").each(function() {
            if ($(this).attr('href') == window.location.pathname) {
                $(this).parent().addClass('active');
            }
        });

        var referral = getReferralFromUrl();

        if (referral) {
            Cookies.set('referral', referral, { expires: 30, domain: getDomainName(window.location.hostname) });
        }

        Waves = WavesAPI.create(WavesAPI.MAINNET_CONFIG);
        var restoredPhrase = Cookies.get('seed');
        var encrypted = Cookies.get('encrypted');

        if (restoredPhrase) {
            seed = Waves.Seed.fromExistingPhrase(restoredPhrase);
            Cookies.set('seed', restoredPhrase, { expires: 1 });
            switch(window.location.pathname) {
                case '/profit/':
                    initSuccessProfit();
                    break;
                case '/exchange/':
                    // initSuccessProfit();
                    break;
                default:
                    initSuccess();
            }
        } else {
            if (encrypted) {
                if (window.location.pathname != '/sign-in/') {
                    window.location = '/sign-in/';
                }
            } else {
                if (window.location.pathname != '/sign-up/' && window.location.pathname != '/sign-up-new/' && window.location.pathname != '/sign-up-import/') {
                    window.location = '/sign-up/';
                } else if (window.location.pathname == '/sign-up-new/') {
                    newWallet();
                }
            }
        }
    }

    // Successful init
    function initSuccess() {
        setValue('address', seed.address);

        Waves.API.Node.v1.assets.balance(seed.address, "4zbprK67hsa732oSGLB6HzE8Yfdj3BcTcehCeTA1G5Lf").then((balance) => {
            var antBalance = parseFloat(parseFloat(balance.balance) / parseFloat(10**8)).toFixed(5);
            setHTML('balanceAnt', antBalance);
            updateCounter();
        });

        Waves.API.Node.v1.assets.balance(seed.address, "7xHHNP8h6FrbP5jYZunYWgGn2KFSBiWcVaZWe644crjs").then((balance) => {
            var btcBalance = parseFloat(parseFloat(balance.balance) / parseFloat(10**8)).toFixed(5);
            setHTML('balanceBtc', btcBalance);
            updateCounter();
        });

        Waves.API.Node.v1.assets.balance(seed.address, "4fJ42MSLPXk9zwjfCdzXdUDAH8zQFCBdBz4sFSWZZY53").then((balance) => {
            var ethBalance = parseFloat(parseFloat(balance.balance) / parseFloat(10**8)).toFixed(5);
            setHTML('balanceEth', ethBalance);
            updateCounter();
        });

        Waves.API.Node.v1.addresses.balance(seed.address).then((balance) => {
            var wavBalance = parseFloat(parseFloat(balance.balance) / parseFloat(10**8)).toFixed(5);
            setHTML('balanceWav', wavBalance);
            updateCounter();
        });

        timeout = setTimeout(initSuccess, 1000);
    }

    // Successful init for profile page
    function initSuccessProfile() {
        anonutopia = web3js.eth.contract(anonutopiaAbi).at(anonutopiaAddress);
        anonutopia.getNickname(function(error, result) {
            if (result.length) {
                setHTML('nicknameTag', result);
                if (!getEl('nickname').value.length) {
                    setValue('nickname', result);
                }
            }
            updateCounter();
        });
        updateCounter();

        timeout = setTimeout(initSuccessProfile, 1000);
    }

    // Successful init for exchange page
    function initSuccessExchange() {
        anote = web3js.eth.contract(anoteAbi).at(anoteAddress);
        anonutopia = web3js.eth.contract(anonutopiaAbi).at(anonutopiaAddress);
        anonutopia.getNickname(function(error, result) {
            if (result.length) {
                setHTML('nicknameTag', result);
            }
        });
        anote.priceBuy(function(error, result) {
            var price = parseFloat(web3js.fromWei(result)).toFixed(5);
            setHTML('priceBuy', price);
            updateCounter();
        });

        timeout = setTimeout(initSuccessExchange, 1000);
    }

    // Successful init for profit page
    function initSuccessProfit() {
        // anote = web3js.eth.contract(anoteAbi).at(anoteAddress);
        // anonutopia = web3js.eth.contract(anonutopiaAbi).at(anonutopiaAddress);
        // anonutopia.getNickname(function(error, result) {
        //     if (result.length) {
        //         setHTML('nicknameTag', result);
        //     }
        //     updateCounter();
        // });
        // anote.balanceProfitOf(web3js.eth.coinbase, function(error, result) {
        //     var balanceProfit = parseFloat(web3js.fromWei(result)).toFixed(5);
        //     setHTML('profit', balanceProfit);
        //     updateCounter();
        // });

        // timeout = setTimeout(initSuccessProfit, 1000);
    }

    // Updates counter for loading purposes
    function updateCounter() {
        componentCounter++;
        if (componentCounter == 4) {
            new QRious({
                size: 300,
                element: document.getElementById('qr'),
                value: 'waves://' + seed.address
            });

            new QRious({
                size: 300,
                element: document.getElementById('qrbitcoin'),
                value: 'bitcoin://' + getEl('addressBitcoin').value
            });

            new QRious({
                size: 300,
                element: document.getElementById('qrethereum'),
                value: getEl('addressEthereum').value
            });

            $('#loader').fadeOut(function() {
                $('#content').fadeIn();
            });
        }
    }

    // Gets DOM element
    function getEl(id) {
        return document.getElementById(id);
    }

    // Sets HTML for element
    function setHTML(id, html) {
        getEl(id).innerHTML = html;
    }

    // Sets value for element
    function setValue(id, value) {
        getEl(id).value = value;
    }

    // Binds event the right way
    function bind(scope, fn) {
        return function() {
            return fn.apply(scope, arguments);
        }
    }

    // Checks and validates fields for payments
    function validatePaymentFields(addressTo, amount) {
        var validates = true;

        if (addressTo.length == 0) {
            $('#addressToGroup').addClass('has-error');
            validates = false;
        }

        if (amount.length == 0) {
            $('#amountGroup').addClass('has-error');
            validates = false;
        }

        if (!validates) {
            setHTML('errorMessagePayment', allLocales.bothFields);
            $('#errorMessagePayment').fadeIn(function() {
            setTimeout(() => {
                $('#errorMessagePayment').fadeOut();
                $('#amountGroup').removeClass('has-error');
                $('#addressToGroup').removeClass('has-error');
            }, 2000);
        });
        }

        return validates;
    }

    // Checks and validates fields for nickname form
    function validateNicknameFields(nickname) {
        var validates = true;

        if (nickname.length == 0) {
            $('#nicknameGroup').addClass('has-error');
            validates = false;
        }

        if (!validates) {
            setHTML('errorMessageNickname', allLocales.jsFieldEmpty);
            $('#errorMessageNickname').fadeIn(function() {
                setTimeout(() => {
                    $('#errorMessageNickname').fadeOut();
                    $('#nicknameGroup').removeClass('has-error');
                }, 2000);
            });
        }

        return validates;
    }

    // Checks and validates field for password form
    function validatePasswordField(password) {
        var validates = true;

        if (password.length == 0) {
            $('#passwordGroup').addClass('has-error');
            validates = false;
        }

        if (!validates) {
            setHTML('required', allLocales.jsFieldEmpty);
            $('#required').fadeIn(function() {
                setTimeout(() => {
                    $('#required').fadeOut();
                    $('#passwordGroup').removeClass('has-error');
                }, 2000);
            });
        }

        return validates;
    }

    // Checks and validates field for password form
    function validateImportFields(password, seed) {
        var validates = true;

        if (password.length == 0) {
            $('#passwordGroupImport').addClass('has-error');
            validates = false;
        }

        if (seed.length == 0) {
            $('#seedGroup').addClass('has-error');
            validates = false;
        }

        if (!validates) {
            setHTML('requiredImport', allLocales.bothFields);
            $('#requiredImport').fadeIn(function() {
                setTimeout(() => {
                    $('#requiredImport').fadeOut();
                    $('#passwordGroupImport').removeClass('has-error');
                    $('#seedGroup').removeClass('has-error');
                }, 2000);
            });
        }

        return validates;
    }

    // Checks and validates fields for exchange form
    function validateExchangeFields(selectedCurrency, amount) {
        var validates = true;

        if (amount.length == 0) {
            $('#amountGroup').addClass('has-error');
            validates = false;
        }

        if (!validates) {
            setHTML('errorMessageExchange', allLocales.jsFieldEmpty);
            $('#errorMessageExchange').fadeIn(function() {
                setTimeout(() => {
                    $('#errorMessageExchange').fadeOut();
                    $('#amountGroup').removeClass('has-error');
                }, 2000);
            });
        }

        return validates;
    }

    // Checks and validates fields for seed
    function validateSeedField(seedTa, checkSeed) {
        var validates = true;

        if (seedTa.length == 0) {
            $('#seedGroup').addClass('has-error');
            validates = false;
            setHTML('errorMessageSeed', allLocales.jsFieldEmpty);
            $('#errorMessageSeed').fadeIn(function() {
                setTimeout(() => {
                    $('#errorMessageSeed').fadeOut();
                    $('#seedGroup').removeClass('has-error');
                }, 2000);
            });
        }

        if (validates && checkSeed && seedTa != seed.phrase) {
            $('#seedGroup').addClass('has-error');
            validates = false;
            setHTML('errorMessageSeed', allLocales.wrongSeed);
            $('#errorMessageSeed').fadeIn(function() {
                setTimeout(() => {
                    $('#errorMessageSeed').fadeOut();
                    $('#seedGroup').removeClass('has-error');
                }, 2000);
            });
        }

        return validates;
    }

    // Checks and validates sign up password fields
    function validateSUPasswords(p1, p2) {
        var validates = true;

        if (p1.length == 0) {
            $('#passwordGroup1').addClass('has-error');
            validates = false;
            setHTML('errorMessagePassword', allLocales.bothFields);
            $('#errorMessagePassword').fadeIn(function() {
                setTimeout(() => {
                    $('#errorMessagePassword').fadeOut();
                    $('#passwordGroup1').removeClass('has-error');
                }, 2000);
            });
        }

        if (p2.length == 0) {
            $('#passwordGroup2').addClass('has-error');
            validates = false;
            setHTML('errorMessagePassword', allLocales.bothFields);
            $('#errorMessagePassword').fadeIn(function() {
                setTimeout(() => {
                    $('#errorMessagePassword').fadeOut();
                    $('#passwordGroup2').removeClass('has-error');
                }, 2000);
            });
        }

        if (validates && p1 != p2) {
            $('#passwordGroup2').addClass('has-error');
            validates = false;
            setHTML('errorMessagePassword', allLocales.passNotMatch);
            $('#errorMessagePassword').fadeIn(function() {
                setTimeout(() => {
                    $('#errorMessagePassword').fadeOut();
                    $('#passwordGroup2').removeClass('has-error');
                }, 2000);
            });
        }

        return validates;
    }

    // Transfers any token
    function transfer(addressTo, amount, assetId, attachment) {
        $('#content').fadeOut(function() {
            $('#transactionInProgress').fadeIn(function() {
                const transferData = {
                    recipient: addressTo,
                    assetId: assetId,
                    amount: amount * 10**8,
                    feeAssetId: '4zbprK67hsa732oSGLB6HzE8Yfdj3BcTcehCeTA1G5Lf',
                    fee: 30000000,
                    attachment: attachment,
                    timestamp: Date.now()
                };

                Waves.API.Node.v1.assets.transfer(transferData, seed.keyPair).then((responseData) => {
                    console.log('responseData');
                    $('#transactionInProgress').fadeOut(function() {
                        $('#transactionSuccess').fadeIn(function() {
                            setTimeout(() => {
                                $('#transactionSuccess').fadeOut();
                            }, 10000);
                        });
                        $('#content').fadeIn();
                    });
                }).catch((err) => {
                    setHTML('errorMessage', err);
                    $('#transactionInProgress').fadeOut(function() {
                        $('#transactionError').fadeIn(function() {
                            setTimeout(() => {
                                $('#transactionError').fadeOut();
                            }, 10000);
                        });
                        $('#content').fadeIn();
                    });
                });
            });
        });
    }

    // Exchange ANO to WAV
    function anoToWav(amount) {
        transfer('3PDb1ULFjazuzPeWkF2vqd1nomKh4ctq9y2', amount, '4zbprK67hsa732oSGLB6HzE8Yfdj3BcTcehCeTA1G5Lf', '');
    }

    // Exchange WAV to ANO
    function wavToAno( amount) {
        transfer('3PDb1ULFjazuzPeWkF2vqd1nomKh4ctq9y2', amount, 'WAVES', '');
    }

    // Exchange BTC to ANO
    function btcToAno(amount) {
        transfer('3PDb1ULFjazuzPeWkF2vqd1nomKh4ctq9y2', amount, '7xHHNP8h6FrbP5jYZunYWgGn2KFSBiWcVaZWe644crjs', '');
    }

    // Exchange ETH to ANO
    function ethToAno(amount) {
        transfer('3PDb1ULFjazuzPeWkF2vqd1nomKh4ctq9y2', amount, '4fJ42MSLPXk9zwjfCdzXdUDAH8zQFCBdBz4sFSWZZY53', '');
    }

    // Gets referral from url
    function getReferralFromUrl(){
        var k = 'r';
        var p={};
        location.search.replace(/[?&]+([^=&]+)=([^&]*)/gi,function(s,k,v){p[k]=v})
        return k?p[k]:p;
    }

    // Gets domain name from url
    function getDomainName(hostName) {
        return hostName.substring(hostName.lastIndexOf(".", hostName.lastIndexOf(".") - 1) + 1);
    }

    // New wallet method
    function newWallet() {
        seed = Waves.Seed.create();
        setHTML('seed', seed.phrase);
        setValue('seedinput', seed.phrase);
        $('#newGroup').fadeIn();
    }

    // Attach all events
    switch (window.location.pathname) {
        case '/':
            getEl('payButton').addEventListener('click', bind(this, this.pay), false);
            break;
        case '/profit/':
            getEl('withdrawButton').addEventListener('click', bind(this, this.withdraw), false);
            break;
        case '/profile/':
            getEl('saveButton').addEventListener('click', bind(this, this.save), false);
            break;
        case '/exchange/':
            getEl('exchangeButton').addEventListener('click', bind(this, this.exchange), false);
            break;
        case '/sign-in/':
            getEl('signInButton').addEventListener('click', bind(this, this.signIn), false);
            break;
        case '/sign-up/':
            break;
        case '/sign-up-new/':
            getEl('signupnext').addEventListener('click', bind(this, this.signUpNext), false);
            getEl('signupnext1').addEventListener('click', bind(this, this.signUpNext1), false);
            getEl('signupnext2').addEventListener('click', bind(this, this.signUpNext2), false);
            getEl('signupcopy').addEventListener('click', bind(this, this.signUpCopy), false);
            break;
        case '/sign-up-import/':
            getEl('importnext').addEventListener('click', bind(this, this.importNext), false);
            getEl('importnext1').addEventListener('click', bind(this, this.importNext1), false);
            break;
    }

    // Calling Wallet constructor
    constructor();
}
