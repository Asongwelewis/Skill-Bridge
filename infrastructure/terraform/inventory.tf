resource "local_file" "ansible_inventory" {
  filename = "${path.module}/../ansible/inventory.ini"
  content  = <<-EOT
[skillbridge]
${digitalocean_droplet.skillbridge_vps.ipv4_address} ansible_user=root ansible_ssh_private_key_file=~/.ssh/id_rsa
EOT
}
