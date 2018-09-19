FROM eosio/eos-dev
RUN apt update -yq && apt install -yq git nodejs npm
RUN cp -r /eos/contracts/eosiolib /opt/eosio/include/
ENTRYPOINT /bin/bash