.PHONY: up down install webpack view

up:
	sudo docker-compose up -d

down:
	sudo docker-compose down

npm:
	sudo docker exec itsraka.github.page npm install --no-optional
	sudo docker exec itsraka.github.page npm install --global webpack webpack-cli --no-optional

webpack:
	sudo docker exec itsraka.github.page webpack -c "--mode=production"

install: up npm webpack

view:
	google-chrome index.html