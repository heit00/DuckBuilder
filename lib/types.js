/**
 * DATA< THIS LIB WILL BECOME A SEPARATED LIB
 */


class Rule {
    #func;
    #label;

    constructor(func, label) {
        if (typeof func !== 'function' || typeof label !== 'string') throw new TypeError('func must be a function and label must be a string.');

        const stringName = Function.prototype.toString.call(func);
        const exp = /^class\s/;
        if (exp.test(stringName)) throw new TypeError('func must be calleable.');

        this.#func = func;
        this.#label = label;
    }

    get func() {
        return this.#func;
    }

    get label() {
        return this.#label;
    }
}

class T {

    static error = {
        notFound: 'NOT_IN',
        typeError: 'DIFERENT_TYPE',
        recursiveError: 'RECURSIVE_ERROR',
        extraKeyError: 'EXTRA_KEY_ERROR'
    }

    static types = {
        // --- NUMBERS ---
        NUM_GENERIC: 'NUMBER',
        NUM_REPRESENTATION: 'NUMBER_REPRESENTATION',
        NUM_BIGINT: 'BIGINT',

        // --- OBJECTS ---
        OBJ_GENERIC: 'OBJECT_GENERIC',
        OBJ_INSTANCE: 'OBJECT_INSTANCE',
        OBJ_UNPROTOTYPED: 'OBJECT_UNPROTOTYPED',
        OBJ_ITERABLE: 'OBJECT_ITERABLE',
        OBJ_PROMISE: 'PROMISE_NATIVE',
        OBJ_THENABLE: 'PROMISE_LIKE',

        // --- STRINGS ---
        STR_GENERIC: 'STRING',
        STR_EMPTY: 'STRING_EMPTY',
        STR_BLANK: 'STRING_BLANK',
        STR_FILLED: 'STRING_FILLED',
        STR_NUMERIC: 'STRING_NUMERIC',
        STR_JSON: 'STRING_JSON_STRUCTURE',
        STR_EMAIL: 'STRING_EMAIL',

        // --- OTHERS ---
        BOOL_GENERIC: 'BOOLEAN',
        FUNC_GENERIC: 'FUNCTION',
        FUNC_CALLABLE: 'FUNCTION_CALLABLE',
        UNKNOWN: 'UNKNOWN'
    };

    static v = {

        number: new Rule(
            (target) => typeof target === 'number',
            T.types.NUM_GENERIC
        ),

        numericString: new Rule(
            (target) => {
                if (typeof target !== 'string' || target.trim().length === 0) return false;
                return !Number.isNaN(Number(target));
            },
            T.types.STR_NUMERIC
        ),

        numberRepresentation: new Rule(
            (target) => {
                const isStrict = T.v.number.func(target);
                const isStringRep = T.v.numericString.func(target);
                return isStrict || isStringRep;
            },
            T.types.NUM_REPRESENTATION
        ),

        genericObj: new Rule(
            (target) => {
                if (target === null || typeof target !== 'object') return false;
                return Reflect.getPrototypeOf(target)?.constructor === Object;
            },
            T.types.OBJ_GENERIC
        ),

        instanceObj: new Rule(
            (target) => {
                if (target === null || typeof target !== 'object') return false;
                const prot = Reflect.getPrototypeOf(target);
                return prot !== null && prot?.constructor !== Object;
            },
            T.types.OBJ_INSTANCE
        ),

        unprototypedObj: new Rule(
            (target) => {
                if (target === null || typeof target !== 'object') return false;
                const prot = Reflect.getPrototypeOf(target);
                return !prot;
            },
            T.types.OBJ_UNPROTOTYPED
        ),

        emptyString: new Rule(
            (target) => {
                if (typeof target !== 'string') return false;
                return target.length === 0;
            },
            T.types.STR_EMPTY
        ),

        spaceEmptyString: new Rule(
            (target) => {
                if (typeof target !== 'string') return false;
                return target.trim().length === 0;
            },
            T.types.STR_BLANK
        ),

        filledString: new Rule(
            (target) => {
                if (typeof target !== 'string') return false;
                return target.trim().length > 0;
            },
            T.types.STR_FILLED
        ),

        jsonString: new Rule(
            (target) => {
                if (typeof target !== 'string') return false;
                try {
                    const tryJsonParser = JSON.parse(target);
                    return tryJsonParser !== null && typeof tryJsonParser === 'object';
                } catch {
                    return false;
                }
            },
            T.types.STR_JSON
        ),

        string: new Rule(
            (target) => typeof target === 'string',
            T.types.STR_GENERIC
        ),

        stringEmail: new Rule((target) => {
            if (typeof target !== 'string') return false;
            const exp = /^\w+(?:[\w-]+\w)?(?:\.\w+(?:[\w-]+\w)?)*@\w+(?:[\w-]+\w)?(?:\.\w+(?:[\w-]+\w)?)+$/;
            return exp.test(target)
        }, T.types.STR_EMAIL),

        bool: new Rule(
            (target) => typeof target === 'boolean',
            T.types.BOOL_GENERIC
        ),

        bigInt: new Rule(
            (target) => typeof target === 'bigint',
            T.types.NUM_BIGINT
        ),

        function: new Rule(
            (target) => typeof target === 'function',
            T.types.FUNC_GENERIC
        ),

        callable: new Rule(
            (target) => {
                if (typeof target !== 'function') return false;
                const stringName = Function.prototype.toString.call(target);
                const exp = /^class\s/;
                return !exp.test(stringName);
            },
            T.types.FUNC_CALLABLE
        ),

        iterable: new Rule(
            (target) => {
                if (typeof target !== 'object' || target === null) return false;
                return typeof target[Symbol.iterator] === 'function';
            },
            T.types.OBJ_ITERABLE
        ),

        nativePromise: new Rule(
            (target) => {
                if (typeof target !== 'object' || target === null) return false;
                return target instanceof Promise;
            },
            T.types.OBJ_PROMISE
        ),

        promiseLike: new Rule(
            (target) => {
                if (target === null || typeof target !== 'object') return false;
                return typeof target.then === 'function';
            },
            T.types.OBJ_THENABLE
        )
    };

    //OBJECTS

    static hasProp(target, ...args) {
        if (typeof target !== 'object' || target === null) throw new TypeError('targe must be a valid object.');
        if (args.length === 1 && Array.isArray(args[0])) args = args[0];
        const props = Reflect.ownKeys(target);
        const notFound = [];
        args.forEach(propKey => {


            if (!props.includes(propKey)) {
                notFound.push(propKey);
            }

            if (notFound.length > 0) {
                return {
                    found: false,
                    notFound
                }
            }
            else return { allFound: true }
        });

    }

    static hasSomeProp(target, ...args) {
        if (typeof target !== 'object' || target === null) throw new TypeError('targe must be a valid object.');
        if (args.length === 1 && Array.isArray(args[0])) args = args[0];
        const props = Reflect.ownKeys(target);
        const found = [];
        args.forEach(propKey => {

            if (props.includes(propKey)) {
                found.push(propKey);
            }

            if (found.length === 0) {
                return {
                    found: false
                }
            }
            else return { found: true, someFound: found }
        });
    }

    //STRINCT ONLY WORKS WITH OBJECTS RULES
    static validate(target, rule, strict = false) {
        if (typeof rule === 'function') {
            if(!T.v.callable.func(rule)) throw new TypeError('functions must be calleables.');

            const label = rule.name || 'CUSTOM-VALIDATOR';
            try {
                const result = rule(target);
                if (result !== true) return { success: false, fail: [{ error: T.error.typeError, expected: label }] };
            }
            catch {
                return { success: false, fail: [{ error: T.error.typeError, expected: T.types.UNKNOWN }] };
            }
        }
        else if (rule instanceof Rule) {
            const func = rule.func;

            const label = rule.label;
            try {
                const isOfType = func(target);

                if (isOfType !== true) return { success: false, fail: [{ error: T.error.typeError, expected: label }] };
            }
            catch {
                return { success: false, fail: [{ error: T.error.typeError, expected: label }] };
            }
        }
        else if(Array.isArray(rule)){
            let success = false;
            for(let subRule of rule){
                const result = T.validate(target, subRule, strict);

                if(result.success === true){
                    success = true;
                    break;
                }
            }
            if(success) return {success};
            else return {success: false, fail: [{ error: T.error.typeError, expected: T.#getUnionLabel(rule) }]}
        }
        else if (typeof rule === 'object' && rule !== null) {
            return T.#validateObj(target, rule, strict);
        }
        else throw new TypeError('rule must be a function, Rule instance or object (NOT NULL)');

        return { success: true };
    }

    static #validateObj(target, config, strict = false) {
        if(typeof strict !== 'boolean') throw new TypeError('strict must be a boolean.');
        if (typeof config !== 'object' || config === null) throw new TypeError('config must be an valid object')
        if (typeof target !== 'object' || target === null) return { success: false, fail: [{error: T.error.typeError, expected: 'OBJECT'}] };

        const props = Reflect.ownKeys(target); 
        const failKeys = [];

        for (let key of Reflect.ownKeys(config)) {

            const prop = config[key];
            const targetProp = target[key];

            if (!props.includes(key)) {
                failKeys.push({ key, error: T.error.notFound });
                continue;
            }

            const result = T.validate(targetProp, prop, strict);

            if (result.fail){
                if(typeof prop === 'object' && !(prop instanceof Rule)  && !(Array.isArray(prop))){
                    failKeys.push({key, fail: result.fail});
                }
                else{
                    failKeys.push({key, ...result.fail[0]});
                }
            }
        }

        if(strict){
            const rules = Reflect.ownKeys(config);
            const extraKeys = props.filter(key => !rules.includes(key));
            extraKeys.forEach(key => {
                const obj = {key , error: T.error.extraKeyError, expected: 'NOTHING'};
                failKeys.push(obj);
            })
        }

        if (failKeys.length === 0) return { success: true };
        else return { success: false, fail: failKeys };
    }

    //ARRAYS-LIKE

    static #getUnionLabel(array){
        if(!Array.isArray(array)) throw new TypeError('array must be a array.');

        const label = array.map(el => {
            // if el is a class it is not calleable
            if(typeof el === 'function') return el.name || 'CUSTOM-VALIDATOR';
            else if(el instanceof Rule) return el.label;
            else if(Array.isArray(el)){
                return `(${T.#getUnionLabel(el)})`;
            }
            else if(typeof el === 'object' && el !== null){
                return `Object<${Reflect.ownKeys(el).join(', ')}>`; 
            }
            else return String(el);
        }).join(' | ');

        return label;
    }

    static areAllOfType(target, rule) {
        if (!Array.isArray(target)) throw new TypeError('targe must be a array.');
        if (target.some(el => !T.validate(el, rule)?.success)) return false;
        return true;
    }

    static hasOfType(target, rule) {
        if (!Array.isArray(target)) throw new TypeError('targe must be a array.');
        if (target.some(el => T.validate(el, rule)?.success)) return true;
        return false;
    }
}

Object.freeze(T);
module.exports = { T, Rule};