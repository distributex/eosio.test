FROM eosio/eos-dev
RUN apt update -yq && apt install -yq git sudo nodejs npm
ENTRYPOINT /bin/bash