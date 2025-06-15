declare global {
  var sseClients: Map<string, any[]> | undefined;
  var usageMonitors: Map<string, NodeJS.Timeout> | undefined;
}

export {};
