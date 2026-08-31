module file > constants, functions, classes etc
python uses current time as seed on random module import

seed() -> current time
seed(int_value)
random()

**pycache** imported file content into a semi-compiled code(bytecode) for interpreter. Faster module load on subsequent imports.
first import?

1.  compilation to bytecode 2. execution of compiled code

second import? 1. skip compilation if there's no change 2. execution
