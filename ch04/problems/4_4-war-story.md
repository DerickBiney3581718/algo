 <!-- I’d been retained by an air travel
company to help design an algorithm to find the cheapest available airfare from
city x to city y. Like most of you, I suspect, I’d been baffled at the crazy price
fluctuations of ticket prices under modern “yield management.” The price of flights
seems to soar far more efficiently than the planes themselves. The problem, it
seemed to me, was that airlines never wanted to show the true cheapest price. -->

problem for a two-hop fare

1. We have two ordered lists by fare.
2. starting from (1,1) index pairs,
3. check that each successor is not in hash map or set already, if they are drop, if not add to set and push them into a priority queue.
4. Get min in pq and check if it's valid.
5. if valid, pop and end, else generate new successors(forward matrix neighbours)
