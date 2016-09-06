#!/bin/bash
nodemon ./app.js
read -n 1 -p "Press any key to continue..." INP
if [ $INP != '' ] ; then
        echo -ne '\b \n'
fi