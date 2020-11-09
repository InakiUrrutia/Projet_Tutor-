echo off

goto(){
uname -o
python -m SimpleHTTPServer
}

goto $@
exit

:(){
rem Windows script here
echo %OS%
python -m http.server
exit
