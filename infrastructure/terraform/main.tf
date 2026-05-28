terraform {
  required_providers {
    digitalocean = {
      source  = "digitalocean/digitalocean"
      version = "~> 2.0"
    }
  }
}

provider "digitalocean" {
  token = var.do_token
}

resource "digitalocean_droplet" "skillbridge_vps" {
  name      = "skillbridge-vps"
  region    = "fra1" # Frankfurt — closest to Cameroon
  size      = "s-4vcpu-8gb" # 8GB RAM as required
  image     = "ubuntu-22-04-x64"
  ssh_keys  = [var.ssh_fingerprint]
  user_data = file("${path.module}/../../scripts/vps_setup_skillbridge.sh")
  tags      = ["skillbridge", "production"]
}
