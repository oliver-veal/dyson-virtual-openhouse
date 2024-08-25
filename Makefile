.PHONY: push
push:
		rsync --include client/assets --exclude node_modules --exclude .git -avz . ubuntu@openhouse.oliverveal.com:/home/ubuntu/openhouse

.PHONY: deploy
deploy:
		make push
		ssh calltest.plyo.ai "cd app && make build && sudo systemctl restart app.service"

.PHONY: install-caddy
install-caddy:
		sudo install deploy/Caddyfile /etc/caddy/Caddyfile

.PHONY: install-service
install-service:
		sudo install -m 0644 -D deploy/app.service /etc/systemd/system/app.service
		sudo systemctl daemon-reload
		sudo systemctl enable app.service
		sudo systemctl start app.service