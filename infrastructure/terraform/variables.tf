variable "do_token" {
  description = "DigitalOcean API token"
  type        = string
  sensitive   = true
}

variable "ssh_fingerprint" {
  description = "SSH key fingerprint added to DigitalOcean"
  type        = string
}

variable "admin_cidrs" {
  description = "CIDR blocks allowed to reach admin-only services such as Jenkins and the K3s API"
  type        = list(string)
}
