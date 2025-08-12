import { supabase, Campaign, SaveCampaignData } from './supabase'

export type { Campaign, SaveCampaignData }

export class CampaignService {
  
  static async saveCampaign(campaignData: SaveCampaignData): Promise<Campaign> {
    const { data, error } = await supabase
      .from('campaigns')
      .insert({
        name: campaignData.name,
        metrics: campaignData.metrics,
        data: campaignData.data
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to save campaign: ${error.message}`)
    }

    return data
  }

  static async updateCampaign(id: string, campaignData: SaveCampaignData): Promise<Campaign> {
    const { data, error } = await supabase
      .from('campaigns')
      .update({
        name: campaignData.name,
        metrics: campaignData.metrics,
        data: campaignData.data,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update campaign: ${error.message}`)
    }

    return data
  }

  static async getCampaigns(): Promise<Campaign[]> {
    const { data, error } = await supabase
      .from('campaigns')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch campaigns: ${error.message}`)
    }

    return data || []
  }

  static async getCampaign(id: string): Promise<Campaign> {
    const { data, error } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      throw new Error(`Failed to fetch campaign: ${error.message}`)
    }

    return data
  }

  static async deleteCampaign(id: string): Promise<void> {
    const { error } = await supabase
      .from('campaigns')
      .delete()
      .eq('id', id)

    if (error) {
      throw new Error(`Failed to delete campaign: ${error.message}`)
    }
  }

  static async searchCampaigns(searchTerm: string): Promise<Campaign[]> {
    const { data, error } = await supabase
      .from('campaigns')
      .select('*')
      .ilike('name', `%${searchTerm}%`)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to search campaigns: ${error.message}`)
    }

    return data || []
  }
}