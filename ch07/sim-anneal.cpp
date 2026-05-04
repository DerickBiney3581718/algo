// Simulated-Annealing()
// Create initial solution S
// Initialize temperature t
// repeat
// for i = 1 to iteration-length do
// Generate a random transition from S to Si
// If (C(S) ≥ C(Si)) then S = Si
// else if (e(C(S)−C(Si))/(k·t) > random[0, 1)) then S = Si
// Reduce temperature t
// until (no change in C(S))
// Return S

anneal(tsp_instance *t, tsp_solution *s)
{
    int i1, i2; /* pair of items to swap */
    int i,j; /* counters */
    double temperature; /* the current system temp */
    double current_value; /* value of current state */
    double start_value; /* value at start of loop */
    double delta; /* value after swap */
    double merit, flip; /* hold swap accept conditions*/
    double exponent; /* exponent for energy funct*/
    double random_float();
    double solution_cost(), transition();
    temperature = INITIAL_TEMPERATURE;

    initialize_solution(t->n,s);
    current_value = solution_cost(s,t);
    for (i=1; i<=COOLING_STEPS; i++) {
        temperature *= COOLING_FRACTION;
        start_value = current_value;
        for (j=1; j<=STEPS_PER_TEMP; j++) {
                /* pick indices of elements to swap */
            i1 = random_int(1,t->n);
            i2 = random_int(1,t->n);
            flip = random_float(0,1);
            delta = transition(s,t,i1,i2);
            exponent = (-delta/current_value)/(K*temperature);
            merit = pow(E,exponent);
            if (delta < 0) /*ACCEPT-WIN*/
            current_value = current_value+delta;
            else { 
                if (merit > flip) /*ACCEPT-LOSS*/
            current_value = current_value+delta;
            else /* REJECT */
            transition(s,t,i1,i2);
            }
        }
    /* restore temperature if progress has been made */
    if ((current_value-start_value) < 0.0) temperature = temperature/COOLING_FRACTION;
    }
}