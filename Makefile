.PHONY: push
push:
		rsync --include client/assets --exclude node_modules --exclude .git -avz . ubuntu@openhouse.oliverveal.com:/home/ubuntu/openhouse

.PHONY: deploy
deploy:
		make push
		ssh openhouse.oliverveal.com "sudo systemctl restart openhouse.service"

.PHONY: install-caddy
install-caddy:
		sudo install deploy/Caddyfile /etc/caddy/Caddyfile
		sudo systemctl restart caddy

.PHONY: install-service
install-service:
		sudo install -m 0644 -D deploy/openhouse.service /etc/systemd/system/openhouse.service
		sudo systemctl daemon-reload
		sudo systemctl enable openhouse.service
		sudo systemctl start openhouse.service