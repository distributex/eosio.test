
SRC := main.cpp
CONTRACT := hello
CXX := eosiocpp

all: $(CONTRACT).wast

$(CONTRACT).wast: $(SRC)
	$(CXX) -o $@ $<

$(CONTRACT).abi: $(SRC)
	$(CXX) -g $@ $<

clean:
	rm -rf *.abi *.wast *.wasm
