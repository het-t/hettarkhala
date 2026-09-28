source program, hello.c, sequence of bits, text files contains only ASCII codes
all other files are called binary files
all information is sequence of 0s and 1s only thing that distinguishes different data object is the context in which we view them 
![compilation system](https://github.com/het-t/hettarkhala/blob/main/master-data/assets/compilation%20system%201.jpg)
4 phases preprocessor, compiler, assembler, linker - collectively compilation system

Processing phase: modified original text file according to directives that begin with #, result is another text file with .i suffix.
Compilation phase: translates .i text file into text file .s which contains assembly program
Assembly phase: assembler translates .s assembly code into machine code, result is .o binary file, if opened in text editor 
it will look gibberish 
Linking phase: linker merges separate precompiled files and outputs executable file which is ready to be loaded in memory 
and executed by system


