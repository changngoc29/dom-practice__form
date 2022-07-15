// Constructor
function Validator(options) {
    function getParent(element, selector) {
        while (element.parentElement) {
            if (element.parentElement.matches(selector)) {
                return element.parentElement;
            }
            element = element.parentElement;
        }
    }

    var selectorRules = {};

    // func to validate
    function validate(inputElement, rule) {
        // var errorElement = getParent(inputElement, '.form-group')
        var errorElement0 = getParent(inputElement, options.formGroupSelector);
        var errorElement = errorElement0.querySelector(options.errorSelector);
        var errorMessage;

        // Take rules form selector rules
        var rules = selectorRules[rule.selector];

        // Loop all rules to check input
        for (var i = 0; i < rules.length; i++) {
            switch (inputElement.type) {
                case 'checkbox':
                case 'radio':
                    errorMessage = rules[i](
                        formElement.querySelector(rule.selector + ':checked')
                    );
                    break;
                default:
                    errorMessage = rules[i](inputElement.value);
            }
            if (errorMessage) break;
        }

        if (errorMessage) {
            errorElement.innerText = errorMessage;
            getParent(inputElement, options.formGroupSelector).classList.add(
                'invalid'
            );
        } else {
            errorElement.innerText = '';
            getParent(inputElement, options.formGroupSelector).classList.remove(
                'invalid'
            );
        }

        return !errorMessage;
    }

    // Take the elements of form
    var formElement = document.querySelector(options.form);
    if (formElement) {
        // handle when submiting
        formElement.onsubmit = (e) => {
            e.preventDefault();

            var isFormValid = true;

            // loop all rules and validate
            options.rules.forEach((rule) => {
                var inputElement = formElement.querySelector(rule.selector);
                isFormValid = validate(inputElement, rule);
            });

            if (isFormValid) {
                if (typeof options.onSubmit === 'function') {
                    var enableInputs = formElement.querySelectorAll('[name]');
                    var formValuesArr = Array.from(enableInputs);
                    var formValues = formValuesArr.reduce((values, input) => {
                        switch (input.type) {
                            case 'radio':
                                values[input.name] = formElement.querySelector(
                                    'input[name="' + input.name + '"]:checked'
                                ).value;
                                break;
                            case 'checkbox':
                                if (!input.matches(':checked')) {
                                    values[input.name] = [];
                                    return values;
                                }

                                if (!Array.isArray(values[input.name])) {
                                    values[input.name] = [];
                                }
                                values[input.name].push(input.value);
                                break;
                            case 'file':
                                values[input.name] = input.files;
                                break;
                            default:
                                values[input.name] = input.value;
                        }
                        return values;
                    }, {});
                    options.onSubmit(formValues);
                }
            } else {
                // formElement.submit();
            }
        };

        options.rules.forEach((rule) => {
            // Save rules for each input by selector rules
            if (Array.isArray(selectorRules[rule.selector])) {
                selectorRules[rule.selector].push(rule.test);
            } else {
                selectorRules[rule.selector] = [rule.test];
            }

            var inputElements = formElement.querySelectorAll(rule.selector);

            Array.from(inputElements).forEach((inputElement) => {
                if (inputElement) {
                    // handle when blur outside input
                    inputElement.onblur = function () {
                        validate(inputElement, rule);
                    };

                    // handle when user inputing
                    inputElement.oninput = function () {
                        var errorElement = getParent(
                            inputElement,
                            options.formGroupSelector
                        ).querySelector(options.errorSelector);
                        errorElement.innerText = '';
                        getParent(
                            inputElement,
                            options.formGroupSelector
                        ).classList.remove('invalid');
                    };
                }
            });
        });
    }
}

// Rules definition
// Rules of rules:
// 1. When have error -> error message
// 2. No error -> nothing done (undefined)
Validator.isRequired = function (selector, message) {
    return {
        selector: selector,
        test: function (value) {
            return value ? undefined : message || 'Please type that input';
        },
    };
};

Validator.isEmail = function (selector, message) {
    return {
        selector: selector,
        test: function (value) {
            var regex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
            return regex.test(value)
                ? undefined
                : message || 'This input must have format of email';
        },
    };
};

Validator.minLength = function (selector, min, message) {
    return {
        selector: selector,
        test: function (value) {
            return value.length >= min
                ? undefined
                : message || `Please type at least ${min} characters`;
        },
    };
};

Validator.isConfirmed = function (selector, callback, message) {
    return {
        selector: selector,
        test: function (value) {
            return value === callback()
                ? undefined
                : message || 'Input is not correct';
        },
    };
};
