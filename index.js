const axios = require('axios');

class CircuitBreaker {
    constructor(){
        this.states = {}; // Manages the state of the circuit-breaker
        this.failureThreshold = 5; // Limits the quantity of retries
        this.cooldownPeriod = 10; // time in seconds
        this.requestTimeout = 1;

    }

    async requestService(reqOptions){
        const endpoint = `${reqOptions.method}:${reqOptions.url}`;

        if(!this.canRequest(endpoint)) return false;
         
        reqOptions.timeout = this.requestTimeout * 1000 // every 10s

        try {
            const res = await axios(reqOptions);
            this.onSuccess(endpoint);
            return res.data;
        } catch (error) {
            this.onFailure(endpoint);
            return false;
        }

    }

    initState(endpoint) {
        this.states[endpoint] = {
            failures: 0,
            cooldownPeriod: this.cooldownPeriod,
            circuit: "CLOSED",
            nextTry: 0
        }
    }

    onFailure(endpoint) {
        const state = this.states[endpoint];
        state.failures +=1;
        if(state.failures > this.failureThreshold){
            state.circuit = "OPEN";
            state.nextTry = new Date() / 1000 + this.cooldownPeriod;
            console.log(`Alert! Circuit at ${endpoint} is at state 'OPEN'`);
        }
    }

    onSuccess(endpoint){
        this.initState(endpoint);
    }

    canRequest(endpoint){
        if(!this.states[endpoint]) this.initState(endpoint);
        const state = this.states[endpoint];
        if(state.circuit === 'CLOSED') return true;
        const now = new Date() / 1000;
        if(state.nextTry <= now){
            state.circuit = "HALF";
            return true
        }
        return false
    }
}

module.exports = CircuitBreaker;