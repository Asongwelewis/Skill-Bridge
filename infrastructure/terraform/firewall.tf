resource "digitalocean_firewall" "skillbridge_fw" {
  name        = "skillbridge-firewall"
  droplet_ids = [digitalocean_droplet.skillbridge_vps.id]

  inbound_rule {
    protocol         = "tcp"
    port_range       = "22"
    source_addresses = ["0.0.0.0/0"]
  }

  inbound_rule {
    protocol         = "tcp"
    port_range       = "80"
    source_addresses = ["0.0.0.0/0"]
  }

  inbound_rule {
    protocol         = "tcp"
    port_range       = "443"
    source_addresses = ["0.0.0.0/0"]
  }

  inbound_rule {
    protocol         = "tcp"
    port_range       = "8080"
    source_addresses = var.admin_cidrs
  } # Jenkins

  inbound_rule {
    protocol         = "tcp"
    port_range       = "6443"
    source_addresses = var.admin_cidrs
  } # K3s API

  outbound_rule {
    protocol              = "tcp"
    port_range            = "1-65535"
    destination_addresses = ["0.0.0.0/0"]
  }
}
