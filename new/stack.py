class Stack:
    def __init__(self):
        self.__stack_list = []

    def pop(self):
        val = self.__stack_list[-1]
        del self.__stack_list[-1]
        return val

    def push(self, val):
        self.__stack_list.append(val)

class AddingStack(Stack):
    def __init__(self):
        super().__init__()
        self.__sum = 0

    def push(self, val):
        self.__sum += val
        return super().push(val)

    def pop(self):
        val = super().pop()
        self.__sum -= val
        return val


if __name__ == "__main__":
    st = Stack()
    st.push("soemthing")
    print(st.__dict__)