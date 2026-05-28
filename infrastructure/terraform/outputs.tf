output "vps_ip" {
  value       = digitalocean_droplet.skillbridge_vps.ipv4_address
  description = "Public IP of SkillBridge VPS"
}
